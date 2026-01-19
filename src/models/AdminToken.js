const mongoose = require('mongoose');

const adminTokenSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        token: {
            type: String,
            required: true,
            unique: true
        },
        deviceInfo: {
            browser: String,
            os: String,
            userAgent: String
        },
        lastUsed: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Compound index for efficient queries
adminTokenSchema.index({ adminId: 1, isActive: 1 });

// Method to update last used timestamp
adminTokenSchema.methods.updateLastUsed = function () {
    this.lastUsed = new Date();
    return this.save();
};

// Static method to get all active tokens
adminTokenSchema.statics.getActiveTokens = function () {
    return this.find({ isActive: true }).select('token');
};

// Static method to deactivate token
adminTokenSchema.statics.deactivateToken = async function (token) {
    return this.findOneAndUpdate(
        { token },
        { isActive: false },
        { new: true }
    );
};

module.exports = mongoose.model('AdminToken', adminTokenSchema);
