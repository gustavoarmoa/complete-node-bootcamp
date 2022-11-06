const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  // Usamos regular expression para estrair o texto
  // const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[1];
  const value = err.filter(
    err => err.match(/(["'])(\\?.)*?\1/)[0] && !err.match(/Input/g)
  );
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProduction = (err, res) => {
  // Quando o erro tem operational true
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
    // Erro de programação
  } else {
    // 1) Log error
    console.log('ERROR', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very strong in Production'
    });
  }
};

module.exports = (err, req, res, next) => {
  //console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    // Erro no banco de dados
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    // Erro para nome de campos duplicados
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    sendErrorProduction(error, res);
  }
};
