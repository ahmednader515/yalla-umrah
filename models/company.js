const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose')

const CompanySchema = new Schema({
    email : {
        type: String,
        required: true,
        unique: true
    }
})

CompanySchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('Company', CompanySchema)