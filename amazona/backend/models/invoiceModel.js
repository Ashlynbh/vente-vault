import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    orders: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  }],
brandId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Referring to the User model
  },
  brandName: {
    type: String,
    required: true
  },
  invoiceIdentifier: {
    type: String,
    unique: true
  },
  invoiceNumber: {
    type: String,
    unique: true
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  items: [
    {
      description: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }
  ],
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date,
  customerDetails: {
    name: String,
    address: String,
    email: String
  },
    fees: {
    type: Number,
    default: 0
  },
  gst: {
    type: Number,
    default: 0
  },
    pdfPath: {
    type: String,
    default: ''
  },
  returnedOrders: [
    {
      order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      },
      reason: String, 
      amount: Number 
    }
  ],
  debitOfOtherRevenue: {
    type: Number,
    default: 0
  },
  refundOnFeesGST: {
    type: Number,
    default: 0
  },
  additionalNotes: String
});

// Pre-save hook to generate invoice number
invoiceSchema.pre('save', function(next) {
  if (this.isNew) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomSequence = Math.random().toString().slice(2, 11); // Example of generating a random sequence
    this.invoiceNumber = `INV-${year}${month}${day}-${randomSequence}`;
  }
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
