package logger

import (
	"os"

	"github.com/sirupsen/logrus"
)

// Logger interface for logging
type Logger interface {
	Debug(args ...interface{})
	Info(args ...interface{})
	Warn(args ...interface{})
	Error(args ...interface{})
	Fatal(args ...interface{})
	Debugf(format string, args ...interface{})
	Infof(format string, args ...interface{})
	Warnf(format string, args ...interface{})
	Errorf(format string, args ...interface{})
	Fatalf(format string, args ...interface{})
}

// logger implements the Logger interface
type logger struct {
	*logrus.Logger
}

// New creates a new logger
func New(level string) Logger {
	l := logrus.New()
	
	// Set output
	l.SetOutput(os.Stdout)
	
	// Set formatter
	l.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
		FieldMap: logrus.FieldMap{
			logrus.FieldKeyTime:  "timestamp",
			logrus.FieldKeyLevel: "level",
			logrus.FieldKeyMsg:   "message",
		},
	})
	
	// Set level
	switch level {
	case "debug":
		l.SetLevel(logrus.DebugLevel)
	case "info":
		l.SetLevel(logrus.InfoLevel)
	case "warn":
		l.SetLevel(logrus.WarnLevel)
	case "error":
		l.SetLevel(logrus.ErrorLevel)
	default:
		l.SetLevel(logrus.InfoLevel)
	}
	
	return &logger{Logger: l}
}

// NewWithModule creates a new logger with a module name
func NewWithModule(module string) Logger {
	l := New("info")
	
	// Add module field
	if log, ok := l.(*logger); ok {
		log.Logger = log.Logger.WithField("module", module).Logger
	}
	
	return l
} 