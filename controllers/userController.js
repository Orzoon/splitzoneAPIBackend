




// single User API
let getUsers = (req,res) => {
    if(req.url === '/favicon.ico')
    {
        //everything here is ignored
    }
    console.log('hello from hell')
}


module.exports = {
    getUsers: getUsers
}