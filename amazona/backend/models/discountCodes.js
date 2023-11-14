
import mongoose from 'mongoose';

const discountCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    value: { type: Number, required: true },  
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  
    isActive: { type: Boolean, default: true }
});

const DiscountCode = mongoose.model('DiscountCode', discountCodeSchema);

export default DiscountCode;