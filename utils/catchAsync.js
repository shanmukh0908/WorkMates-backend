module.exports = (fn) => {
    return (req,res,next) =>{
        fn(req,res,next).catch(next)
    }
}

// its equivelent :
/*
module.exports =  function catchAsync(fn) {
  return function(req, res, next) {
    fn(req, res, next).catch(next);
  };
}
  */