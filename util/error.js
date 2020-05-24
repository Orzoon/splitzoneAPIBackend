class Errorhandler extends Error{
    constructor(statusCode, message){
        super();
        this.statusCode = statusCode;
        this.message = message;
    }
}

const handleError = (err, res) => {
    const {statusCode, message} = err;
     // handling error for the validator array
     if(err.statusCode === 400 && Array.isArray(err.message)){
        res.status(statusCode).json({
            status: "error",
            statusCode,
            message: err.message
        });
    }
    else if(err.statusCode === 400 && typeof(err) === 'object' && err !== null){
        res.status(statusCode).json({
            status: "error",
            statusCode,
            message
        });
    }
    else{
        res.status(500).json({
            status: "error",
            statusCode: 500,
            message: "Something went wrong try again later"
        });
    }

}

module.exports = {
    Errorhandler,
    handleError
}