
/* Facebook */
const facebook = {
    clientID: "25548538464gsgsgs765923g1",
    clientSecret: "18fce079e8047b38gsgsgsgs8e8367b563035d19d58",
    callbackURL: "http://localhost:5000/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email']
}

const google = {
    clientID: process.env.GOOGLECLIENTID,
    clientSecret: process.env.GOOGLECLIENTSECRET,
    callbackURL: process.env.GOOGLECALLBACKURI
}
module.exports = {
    facebook,
    google
}