
/* Facebook */
const facebook = {
    clientID: "2554853864769231",
    clientSecret: "18fce079e847b388e867b56303d19d58",
    callbackURL: "http://localhost:5000/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email']
}

const google = {
    clientID: "19140264306-4s32jvp9ue7ai89gnu6cumodt6cqssqa.apps.googleusercontent.com",
    clientSecret: "dEcszp9e854qqU1TVM1TljRs",
    callbackURL: "http://localhost:5000/auth/facebook/callback"
}
module.exports = {
    facebook,
    google
}