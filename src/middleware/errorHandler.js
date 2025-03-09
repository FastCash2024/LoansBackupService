const errorHandler = (err, req, res, next) => {  
    // Definir la respuesta por defecto
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';
  
    // Enviar la respuesta
    res.status(statusCode).json({
      status: 'error',
      statusCode,
      message,
    });
  };
  
  export  {errorHandler};
  