
from PIL import Image

def create_icon(size, color, file_path):
    img = Image.new('RGB', (size, size), color = color)
    img.save(file_path)

create_icon(16, 'blue', '/Users/cliffordxu/Documents/projects/chrome-extension/images/icon16.png')
create_icon(48, 'blue', '/Users/cliffordxu/Documents/projects/chrome-extension/images/icon48.png')
create_icon(128, 'blue', '/Users/cliffordxu/Documents/projects/chrome-extension/images/icon128.png')
