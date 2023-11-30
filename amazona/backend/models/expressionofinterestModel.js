import mongoose from 'mongoose';

const expressionOfInterestSchema = new mongoose.Schema({
  brandName: { type: String, required: true },
  contactName: { type: String, required: true },
  email: { type: String, required: true },
  website: { type: String, required: false },
  message: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Other relevant fields
}, {
  timestamps: true,
});

const ExpressionOfInterest = mongoose.model('ExpressionOfInterest', expressionOfInterestSchema);

export default ExpressionOfInterest;

