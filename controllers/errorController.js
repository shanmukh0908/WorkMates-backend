module.exports = (err, req, res, next) => {
  console.log(err)
  return res.status(err.statusCode || 500).json({
    status: 'error',
    data: err
  });
};
