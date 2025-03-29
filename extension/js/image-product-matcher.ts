/**
 * Image-based Product Matcher
 * 
 * A TypeScript module that provides image-based product matching functionality:
 * - Accepts image input
 * - Generates embedding using pre-trained model
 * - Computes similarity scores
 * - Filters and ranks product matches
 * - Handles cross-website compatibility
 */

// Import TensorFlow.js
// Using import type for the types and dynamic import for the actual module
import type * as tf from '@tensorflow/tfjs';
// We'll use dynamic import() for the actual module to avoid build-time issues

// Types for our module
export interface ProductMatch {
  id: string;
  productUrl: string;
  imageUrl: string;
  title: string;
  price: string;
  similarityScore: number;
  source: string; // e.g., "amazon", "etsy", etc.
}

export interface MatchingOptions {
  minSimilarityScore: number;
  maxResults: number;
  includeRetailers: string[];
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface ImageEmbedding {
  vector: number[];
  dimensions: number;
  modelVersion: string;
}

// Default options
const DEFAULT_OPTIONS: MatchingOptions = {
  minSimilarityScore: 0.7,
  maxResults: 10,
  includeRetailers: ['amazon', 'etsy', 'ebay', 'walmart'],
};

/**
 * Main class for image-based product matching
 */
export class ImageProductMatcher {
  private model: any = null; // Use any for the model to avoid type errors
  private isModelLoaded: boolean = false;
  private modelVersion: string = 'mobilenet_v2';
  private embeddingCache: Map<string, ImageEmbedding> = new Map();
  private tf: typeof tf | null = null; // Store the TensorFlow.js module

  /**
   * Initialize the matcher with the pre-trained model
   */
  constructor() {
    this.loadModel();
  }

  /**
   * Load the pre-trained model for generating embeddings
   */
  private async loadModel(): Promise<void> {
    try {
      // Dynamically import TensorFlow.js to avoid build issues
      this.tf = await import('@tensorflow/tfjs');
      
      // Load MobileNet model for image feature extraction
      this.model = await this.tf.loadGraphModel(
        'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/feature_vector/2/default/1',
        { fromTFHub: true }
      );
      this.isModelLoaded = true;
      console.log('Product matching model loaded successfully');
    } catch (error) {
      console.error('Failed to load product matching model:', error);
    }
  }

  /**
   * Ensure the model is loaded before proceeding
   */
  private async ensureModelLoaded(): Promise<void> {
    if (!this.isModelLoaded) {
      await this.loadModel();
      if (!this.isModelLoaded) {
        throw new Error('Model failed to load');
      }
    }
  }

  /**
   * Generate embedding from an image element
   */
  public async generateEmbedding(imageElement: HTMLImageElement): Promise<ImageEmbedding> {
    await this.ensureModelLoaded();
    
    if (!this.tf) {
      throw new Error('TensorFlow module not loaded');
    }
    
    // Create a unique key for this image for caching
    const imageKey = imageElement.src;
    
    // Check if we have this embedding cached
    if (this.embeddingCache.has(imageKey)) {
      return this.embeddingCache.get(imageKey)!;
    }
    
    // Preprocess the image to match model input requirements
    const imageTensor = this.tf.browser.fromPixels(imageElement)
      .resizeBilinear([224, 224]) // Resize to model input size
      .toFloat()
      .div(this.tf.scalar(255))  // Normalize to [0,1]
      .expandDims(0);       // Add batch dimension
    
    // Generate embedding
    if (!this.model) {
      throw new Error('Model not loaded');
    }
    
    const prediction = this.model.predict(imageTensor);
    const embedding = await prediction.data();
    
    // Convert to regular array
    const embeddingArray = Array.from(embedding);
    
    // Create embedding object
    const embeddingObject: ImageEmbedding = {
      vector: embeddingArray as number[],
      dimensions: embeddingArray.length,
      modelVersion: this.modelVersion
    };
    
    // Cache the embedding
    this.embeddingCache.set(imageKey, embeddingObject);
    
    // Dispose tensors to free memory
    imageTensor.dispose();
    prediction.dispose();
    
    return embeddingObject;
  }

  /**
   * Generate embedding from an image URL
   */
  public async generateEmbeddingFromUrl(imageUrl: string): Promise<ImageEmbedding> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          const embedding = await this.generateEmbedding(img);
          resolve(embedding);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image from URL: ${imageUrl}`));
      };
      img.src = imageUrl;
    });
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   */
  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embedding dimensions do not match');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Find similar products based on an image embedding
   */
  public async findSimilarProducts(
    imageEmbedding: ImageEmbedding,
    options: Partial<MatchingOptions> = {}
  ): Promise<ProductMatch[]> {
    // Merge default options with provided options
    const mergedOptions: MatchingOptions = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      // This would normally fetch product embeddings from an API
      // For demo purposes, we'll simulate API response
      const productMatches = await this.fetchProductMatches(imageEmbedding, mergedOptions);
      return this.rankAndFilterMatches(productMatches, mergedOptions);
    } catch (error) {
      console.error('Error finding similar products:', error);
      return [];
    }
  }

  /**
   * Fetch product matches from API (simulated)
   */
  private async fetchProductMatches(
    imageEmbedding: ImageEmbedding,
    options: MatchingOptions
  ): Promise<ProductMatch[]> {
    // In a real implementation, this would make API calls to product search services
    // Simulating API response for demonstration
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockProducts: ProductMatch[] = [
          {
            id: 'prod1',
            productUrl: 'https://www.amazon.com/product1',
            imageUrl: 'https://example.com/product1.jpg',
            title: 'Blue Dress with Floral Pattern',
            price: '$49.99',
            similarityScore: 0.92,
            source: 'amazon'
          },
          {
            id: 'prod2',
            productUrl: 'https://www.etsy.com/product2',
            imageUrl: 'https://example.com/product2.jpg',
            title: 'Handmade Floral Dress',
            price: '$65.00',
            similarityScore: 0.88,
            source: 'etsy'
          },
          {
            id: 'prod3',
            productUrl: 'https://www.walmart.com/product3',
            imageUrl: 'https://example.com/product3.jpg',
            title: 'Summer Floral Dress',
            price: '$39.95',
            similarityScore: 0.85,
            source: 'walmart'
          },
          {
            id: 'prod4',
            productUrl: 'https://www.ebay.com/product4',
            imageUrl: 'https://example.com/product4.jpg',
            title: 'Vintage Style Floral Dress',
            price: '$42.50',
            similarityScore: 0.78,
            source: 'ebay'
          },
          {
            id: 'prod5',
            productUrl: 'https://www.target.com/product5',
            imageUrl: 'https://example.com/product5.jpg',
            title: 'Casual Floral Pattern Dress',
            price: '$29.99',
            similarityScore: 0.75,
            source: 'target'
          },
        ];
        
        resolve(mockProducts);
      }, 1000); // Simulate network delay
    });
  }

  /**
   * Rank and filter product matches based on options
   */
  private rankAndFilterMatches(
    matches: ProductMatch[],
    options: MatchingOptions
  ): ProductMatch[] {
    // Filter by similarity score
    let filteredMatches = matches.filter(
      match => match.similarityScore >= options.minSimilarityScore
    );
    
    // Filter by retailers
    if (options.includeRetailers.length > 0) {
      filteredMatches = filteredMatches.filter(
        match => options.includeRetailers.includes(match.source)
      );
    }
    
    // Filter by price range if provided
    if (options.priceRange) {
      filteredMatches = filteredMatches.filter(match => {
        const price = parseFloat(match.price.replace(/[^0-9.]/g, ''));
        return price >= options.priceRange!.min && price <= options.priceRange!.max;
      });
    }
    
    // Sort by similarity score (highest first)
    filteredMatches.sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Limit to maximum number of results
    return filteredMatches.slice(0, options.maxResults);
  }

  /**
   * Utility method to extract the main product image from the current page
   */
  public static getMainProductImage(): HTMLImageElement | null {
    // Try various selectors based on common e-commerce sites
    const selectors = [
      // Amazon
      '#landingImage', '#imgBlkFront', '.image-block img',
      // Etsy
      '.wt-max-width-full img', '.listing-page-image-carousel-component img',
      // eBay
      '#icImg', '.mainImg',
      // Walmart
      '.prod-hero-image img',
      // General selectors for product pages
      '.product-image img', '.product-main-image img', '.main-product-image',
      // Fallback to the largest image on the page
    ];

    // Try each selector
    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLImageElement;
      if (element && element.tagName === 'IMG' && element.src) {
        return element;
      }
    }

    // Fallback: find the largest image on the page
    let largestImage: HTMLImageElement | null = null;
    let largestArea = 0;

    document.querySelectorAll('img').forEach((img) => {
      const area = img.width * img.height;
      if (area > largestArea && img.src && !img.src.includes('logo') && !img.src.includes('icon')) {
        largestArea = area;
        largestImage = img;
      }
    });

    return largestImage;
  }
}

// Export a singleton instance for ease of use
export const productMatcher = new ImageProductMatcher();

// Example usage:
/*
// Get product image from current page
const productImage = ImageProductMatcher.getMainProductImage();

if (productImage) {
  // Generate embedding
  const embedding = await productMatcher.generateEmbedding(productImage);
  
  // Find similar products
  const matches = await productMatcher.findSimilarProducts(embedding, {
    minSimilarityScore: 0.8,
    maxResults: 5,
    includeRetailers: ['amazon', 'etsy']
  });
  
  console.log('Similar products:', matches);
}
*/ 