import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI, clinicAPI, clientAPI, petAPI, productAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import PrintInvoiceModal from '../../components/modals/PrintInvoiceModal';
import { formatCurrency, errorMessage } from '../../utils/helpers';
import {
  UserIcon, MagnifyingGlassIcon, XMarkIcon, PlusIcon, TrashIcon,
  CheckCircleIcon, DocumentArrowDownIcon, PrinterIcon, PlusCircleIcon,
  ReceiptPercentIcon, BeakerIcon, ShoppingBagIcon, UserPlusIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const QUICK_CLIENT_EMPTY = {
  name: '', mobile: '', email: '', address: '', petName: '', petSpecies: 'Dog', petBreed: '',
};

export default function NewBillPage() {
  const navigate = useNavigate();
  const [flowType, setFlowType] = useState('PRODUCT'); // 'PRODUCT' | 'CLINIC'
  const [step, setStep] = useState('bill'); // 'bill' | 'success'
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Shared Customer State
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [walkInName, setWalkInName] = useState('');
  const [walkInMobile, setWalkInMobile] = useState('');
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);

  // Quick Register Modal State
  const [showQuickRegisterModal, setShowQuickRegisterModal] = useState(false);
  const [quickClientForm, setQuickClientForm] = useState(QUICK_CLIENT_EMPTY);
  const [savingQuickClient, setSavingQuickClient] = useState(false);

  // PRODUCT BILL STATE
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [cart, setCart] = useState([]);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedBill, setCompletedBill] = useState(null);

  // CLINIC BILL STATE
  const [clinicItems, setClinicItems] = useState([
    { type: 'CONSULTATION', description: 'General Consultation', quantity: 1, unitCost: 300, productRef: null },
  ]);
  const [clinicNotes, setClinicNotes] = useState('');

  // Client search debounce
  useEffect(() => {
    if (isWalkIn) { setClientResults([]); return; }
    const t = setTimeout(() => {
      clientAPI.search(clientSearch).then((r) => setClientResults(r.data.clients || []));
    }, 200);
    return () => clearTimeout(t);
  }, [clientSearch, isWalkIn]);

  // Product search debounce for Product billing
  useEffect(() => {
    const t = setTimeout(() => {
      productAPI.search(productSearch).then((r) => setProductResults(r.data.products || []));
    }, 200);
    return () => clearTimeout(t);
  }, [productSearch]);

  const selectClient = async (client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setShowClientDropdown(false);
    try {
      const r = await petAPI.getByOwner(client._id);
      const fetchedPets = r.data.pets || [];
      setPets(fetchedPets);
      if (fetchedPets.length > 0) setSelectedPet(fetchedPets[0]);
      else setSelectedPet(null);
    } catch {}
  };

  const clearClient = () => {
    setSelectedClient(null);
    setClientSearch('');
    setPets([]);
    setSelectedPet(null);
  };

  // Quick Client Registration Handler
  const handleQuickRegisterClient = async (e) => {
    e.preventDefault();
    if (!quickClientForm.name.trim() || !quickClientForm.mobile.trim()) {
      return toast.error('Client Name and Mobile Number are required.');
    }

    setSavingQuickClient(true);
    try {
      // 1. Create Client
      const clientRes = await clientAPI.create({
        name: quickClientForm.name.trim(),
        mobile: quickClientForm.mobile.trim(),
        email: quickClientForm.email.trim() || undefined,
        address: quickClientForm.address.trim() || undefined,
      });
      const newClient = clientRes.data.client;

      // 2. Create Pet if pet name provided
      let newPet = null;
      if (quickClientForm.petName.trim()) {
        const petRes = await petAPI.create({
          name: quickClientForm.petName.trim(),
          species: quickClientForm.petSpecies || 'Dog',
          breed: quickClientForm.petBreed.trim() || undefined,
          owner: newClient._id,
        });
        newPet = petRes.data.pet;
      }

      toast.success(`Client ${newClient.name} registered successfully!`);
      setShowQuickRegisterModal(false);
      setQuickClientForm(QUICK_CLIENT_EMPTY);

      // 3. Auto-select registered Client & Pet in Billing Desk
      setSelectedClient(newClient);
      setClientSearch(newClient.name);
      if (newPet) {
        setPets([newPet]);
        setSelectedPet(newPet);
      } else {
        const r = await petAPI.getByOwner(newClient._id);
        const fetchedPets = r.data.pets || [];
        setPets(fetchedPets);
        if (fetchedPets.length > 0) setSelectedPet(fetchedPets[0]);
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingQuickClient(false);
    }
  };

  // ── PRODUCT BILL HANDLERS ──────────────────────────────────────────────────
  const addToCart = (product) => {
    if (product.expiryStatus === 'EXPIRED') {
      toast.error(`${product.name} has expired and cannot be sold.`);
      return;
    }
    if (product.currentStock === 0) {
      toast.error(`${product.name} is out of stock.`);
      return;
    }
    const existing = cart.find((i) => i.productId === product._id);
    if (existing) {
      if (existing.quantity >= product.currentStock) {
        toast.error(`Only ${product.currentStock} units available.`);
        return;
      }
      setCart((c) => c.map((i) => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart((c) => [...c, {
        productId: product._id,
        productName: product.name,
        productCode: product.productCode,
        unitPrice: product.sellingPrice,
        gstRate: product.gstRate || 0,
        currentStock: product.currentStock,
        quantity: 1,
        discount: 0,
      }]);
    }
    setProductSearch('');
    setProductResults([]);
    toast.success(`${product.name} added to cart.`);
  };

  const updateCartItem = (productId, field, value) => {
    setCart((c) => c.map((item) => {
      if (item.productId !== productId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' && value > item.currentStock) {
        toast.error(`Only ${item.currentStock} units available.`);
        return item;
      }
      return updated;
    }));
  };

  const removeFromCart = (productId) => setCart((c) => c.filter((i) => i.productId !== productId));

  const cartTotals = cart.reduce((acc, item) => {
    const base = item.unitPrice * item.quantity - (item.discount || 0);
    const gst = parseFloat(((base * item.gstRate) / 100).toFixed(2));
    const lineTotal = base + gst;
    acc.subtotal += item.unitPrice * item.quantity;
    acc.gst += gst;
    acc.itemDiscount += item.discount || 0;
    acc.lineTotal += lineTotal;
    return acc;
  }, { subtotal: 0, gst: 0, itemDiscount: 0, lineTotal: 0 });

  const grandTotal = Math.max(0, cartTotals.lineTotal - Number(overallDiscount || 0));
  const change = paidAmount ? Math.max(0, Number(paidAmount) - grandTotal) : 0;

  const handleConfirmProductPayment = async () => {
    if (!isWalkIn && !selectedClient) return toast.error('Please select a customer.');
    if (isWalkIn && !walkInName.trim()) return toast.error('Enter walk-in customer name.');
    if (cart.length === 0) return toast.error('Cart is empty. Add at least one product.');

    setSubmitting(true);
    try {
      const payload = {
        isWalkIn,
        clientId: !isWalkIn ? selectedClient?._id : undefined,
        walkInName: isWalkIn ? walkInName : undefined,
        walkInMobile: isWalkIn ? walkInMobile : undefined,
        petId: selectedPet?._id,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, discount: i.discount || 0 })),
        overallDiscount: Number(overallDiscount || 0),
        paymentMethod,
        paymentReference: paymentRef,
        paidAmount: paidAmount ? Number(paidAmount) : undefined,
      };

      const res = await billingAPI.createBill(payload);
      setCompletedBill({ ...res.data.bill, billType: 'PRODUCT' });
      setStep('success');
      toast.success('Product Shop bill created! Customer automatically registered.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ── CLINIC BILL HANDLERS ───────────────────────────────────────────────────
  const addClinicItem = () => {
    setClinicItems((items) => [
      ...items,
      { type: 'CONSULTATION', description: '', quantity: 1, unitCost: 0, productRef: null },
    ]);
  };

  const removeClinicItem = (idx) => {
    setClinicItems((items) => items.filter((_, i) => i !== idx));
  };

  const updateClinicItem = (idx, field, value) => {
    setClinicItems((items) => {
      const next = [...items];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const clinicTotal = clinicItems.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitCost || 0)), 0);

  const handleConfirmClinicBilling = async () => {
    if (!selectedClient) return toast.error('Please select a client for clinic billing.');
    if (!selectedPet) return toast.error('Please select a pet for clinic billing.');
    if (clinicItems.length === 0) return toast.error('Add at least one clinic billing item.');

    for (const item of clinicItems) {
      if (!item.description.trim()) return toast.error('Each clinic item must have a description.');
      if (item.unitCost === '' || Number(item.unitCost) < 0) return toast.error('Each item must have a valid cost.');
    }

    setSubmitting(true);
    try {
      const payload = {
        clientId: selectedClient._id,
        petId: selectedPet._id,
        items: clinicItems.map((i) => ({
          type: i.type,
          description: i.description,
          quantity: Number(i.quantity || 1),
          unitCost: Number(i.unitCost || 0),
          productRef: i.productRef || undefined,
        })),
        notes: clinicNotes,
      };

      const res = await clinicAPI.createClinicBilling(payload);
      setCompletedBill({ ...res.data.bill, billType: 'CLINIC' });
      setStep('success');
      toast.success('Internal Clinic billing record saved (NO GST).');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('bill');
    setIsWalkIn(false);
    setSelectedClient(null);
    setClientSearch('');
    setPets([]);
    setSelectedPet(null);
    setWalkInName('');
    setWalkInMobile('');
    setCart([]);
    setOverallDiscount(0);
    setPaymentMethod('CASH');
    setPaymentRef('');
    setPaidAmount('');
    setClinicItems([{ type: 'CONSULTATION', description: 'General Consultation', quantity: 1, unitCost: 300, productRef: null }]);
    setClinicNotes('');
    setCompletedBill(null);
  };

  // ── SUCCESS SCREEN ─────────────────────────────────────────────────────────
  if (step === 'success' && completedBill) {
    const isProduct = completedBill.billType === 'PRODUCT';
    return (
      <div className="max-w-xl mx-auto text-center space-y-6">
        <div className="card card-body">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isProduct ? 'bg-green-100' : 'bg-amber-100'}`}>
            <CheckCircleIcon className={`h-12 w-12 ${isProduct ? 'text-green-600' : 'text-amber-600'}`} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isProduct ? 'Product Bill Created!' : 'Clinic Record Saved!'}
          </h2>
          <p className="text-slate-500 mt-1">
            {isProduct ? 'Customer invoice generated and inventory updated' : 'Internal clinic record stored in customer/pet history'}
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mt-4 text-left space-y-2 text-sm border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Bill Number</span>
              <span className="font-bold text-primary-700 font-mono">
                {isProduct ? completedBill.invoiceNumber : completedBill.clinicBillId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer</span>
              <span className="font-medium">
                {isProduct
                  ? (completedBill.isWalkIn ? completedBill.walkInName : completedBill.clientNameSnapshot)
                  : (selectedClient?.name || 'Clinic Client')}
              </span>
            </div>
            {selectedPet && (
              <div className="flex justify-between">
                <span className="text-slate-500">Pet</span>
                <span className="font-medium">🐶 {selectedPet.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Billing Type</span>
              <span className={`badge ${isProduct ? 'badge-blue' : 'badge-amber'}`}>
                {isProduct ? 'PRODUCT SHOP (GST)' : 'CLINIC BILL (NO GST)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GST Amount</span>
              <span className={isProduct ? 'text-slate-800' : 'text-green-600 font-semibold'}>
                {isProduct ? formatCurrency(completedBill.gstAmount) : '₹0.00 (NO GST)'}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>Grand Total</span>
              <span className="text-green-600">{formatCurrency(isProduct ? completedBill.grandTotal : completedBill.totalAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {isProduct ? (
              <>
                <button onClick={() => billingAPI.downloadPdf(completedBill._id, completedBill.invoiceNumber)} className="btn btn-primary gap-2">
                  <DocumentArrowDownIcon className="h-5 w-5" /> Download PDF
                </button>
                <button onClick={() => setIsPrintModalOpen(true)} className="btn btn-secondary gap-2">
                  <PrinterIcon className="h-5 w-5" /> Print Invoice
                </button>
              </>
            ) : (
              <div className="col-span-2 p-3 bg-amber-50 text-amber-800 rounded-xl text-xs text-center border border-amber-200">
                ℹ️ <strong>Internal Record:</strong> Clinic billing records do NOT issue a customer-facing invoice. Record saved in pet history.
              </div>
            )}
            <button onClick={() => navigate('/billing/history')} className="btn btn-secondary gap-2 col-span-1">
              View History
            </button>
            <button onClick={handleReset} className="btn btn-shop gap-2 col-span-1">
              <PlusCircleIcon className="h-5 w-5" /> Create Another Bill
            </button>
          </div>

          <PrintInvoiceModal
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
            bill={completedBill}
          />
        </div>
      </div>
    );
  }

  // ── MAIN BILLING INTERFACE ────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Billing Desk</h1>
          <p className="page-subtitle">Select billing type: Product Shop Invoice (GST) vs Pet Clinic Record (NO GST)</p>
        </div>

        {/* Top Billing Flow Toggle */}
        <div className="inline-flex bg-slate-200 p-1 rounded-xl font-medium text-sm">
          <button
            onClick={() => setFlowType('PRODUCT')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all ${
              flowType === 'PRODUCT'
                ? 'bg-shop-600 text-white shadow-md font-bold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <ShoppingBagIcon className="h-4 w-4" />
            Product Shop Bill (GST)
          </button>
          <button
            onClick={() => {
              setFlowType('CLINIC');
              setIsWalkIn(false);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all ${
              flowType === 'CLINIC'
                ? 'bg-primary-600 text-white shadow-md font-bold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <BeakerIcon className="h-4 w-4" />
            Pet Clinic Bill (NO GST)
          </button>
        </div>
      </div>

      {/* Flow Banner */}
      {flowType === 'PRODUCT' ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between text-sm text-blue-900">
          <div className="flex items-center gap-3">
            <span className="text-xl">🧾</span>
            <div>
              <p className="font-bold">PRODUCT SHOP BILL — Customer Invoice + GST</p>
              <p className="text-xs text-blue-700">Calculates GST, generates customer invoice, auto-registers customer & deducts inventory stock.</p>
            </div>
          </div>
          <span className="badge badge-blue">Customer Invoice</span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-sm text-amber-900">
          <div className="flex items-center gap-3">
            <span className="text-xl">🩺</span>
            <div>
              <p className="font-bold">CLINIC TREATMENT BILL — Internal System Record (NO GST)</p>
              <p className="text-xs text-amber-700">Internal reference record stored in customer/pet history. Zero GST. No customer invoice generated.</p>
            </div>
          </div>
          <span className="badge badge-amber">Internal Record (No GST)</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT 2 COLS: CUSTOMER & BILLING ITEMS */}
        <div className="lg:col-span-2 space-y-4">

          {/* Customer Selection Card */}
          <div className="card card-body space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary-600" />
                Customer Information
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickRegisterModal(true)}
                className="btn btn-secondary btn-xs text-xs font-semibold gap-1 text-primary-700 bg-primary-50 hover:bg-primary-100 border-primary-200"
              >
                <UserPlusIcon className="h-3.5 w-3.5" /> + Register New Client
              </button>
            </div>

            {flowType === 'PRODUCT' ? (
              <div className="flex gap-2">
                <button onClick={() => { setIsWalkIn(false); clearClient(); }}
                  className={`btn flex-1 ${!isWalkIn ? 'btn-primary' : 'btn-secondary'}`}>
                  <UserIcon className="h-4 w-4" /> Registered Client
                </button>
                <button onClick={() => { setIsWalkIn(true); clearClient(); }}
                  className={`btn flex-1 ${isWalkIn ? 'btn-shop' : 'btn-secondary'}`}>
                  <UserIcon className="h-4 w-4" /> Walk-in Customer
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Clinic billing requires a registered client and pet reference.
              </div>
            )}

            {isWalkIn && flowType === 'PRODUCT' ? (
              <div className="form-grid">
                <div>
                  <label className="label">Customer Name *</label>
                  <input className="input" value={walkInName} onChange={(e) => setWalkInName(e.target.value)} placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="label">Mobile Number</label>
                  <input className="input" value={walkInMobile} onChange={(e) => setWalkInMobile(e.target.value)} placeholder="9876543210" />
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="label mb-0">Search Registered Client *</label>
                  </div>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    {selectedClient ? (
                      <div className="input flex items-center justify-between bg-primary-50/50 border-primary-300">
                        <div>
                          <span className="font-bold text-slate-800">{selectedClient.name}</span>
                          <span className="text-slate-500 text-xs ml-2">({selectedClient.clientId} · 📱 {selectedClient.mobile})</span>
                        </div>
                        <button onClick={clearClient} className="text-slate-400 hover:text-red-500">
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <input
                        className="input pl-9"
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => {
                          setShowClientDropdown(true);
                          clientAPI.search(clientSearch).then((r) => setClientResults(r.data.clients || []));
                        }}
                        placeholder="Click or type to search client by name, mobile, ID..."
                      />
                    )}
                  </div>
                  {showClientDropdown && !selectedClient && clientResults.length > 0 && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      <div className="p-2 bg-slate-50 border-b text-xs text-slate-500 font-semibold flex justify-between">
                        <span>{clientSearch ? `Matching Clients (${clientResults.length})` : `Recent Clients (${clientResults.length})`}</span>
                        <button type="button" onClick={() => setShowClientDropdown(false)} className="text-slate-400 hover:text-slate-700">Close ✕</button>
                      </div>
                      {clientResults.map((c) => (
                        <button key={c._id} type="button" onClick={() => selectClient(c)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-sm border-b last:border-0 text-left">
                          <div className="text-left">
                            <p className="font-medium text-slate-800">{c.name}</p>
                            <p className="text-xs text-slate-400">{c.clientId} · 📱 {c.mobile}</p>
                          </div>
                          <span className="text-xs btn btn-secondary btn-sm">Select</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pet Selection */}
                {selectedClient && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="label mb-0">Select Pet {flowType === 'CLINIC' && '*'}</label>
                      <button
                        type="button"
                        onClick={() => setShowQuickRegisterModal(true)}
                        className="text-xs text-primary-600 hover:underline font-medium"
                      >
                        + Add New Pet
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {pets.map((p) => (
                        <button key={p._id} type="button" onClick={() => setSelectedPet(p)}
                          className={`px-3.5 py-1.5 rounded-xl text-sm border transition-all ${
                            selectedPet?._id === p._id
                              ? 'bg-primary-600 text-white border-primary-600 font-bold shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}>
                          {p.species === 'Cat' ? '🐱' : '🐶'} {p.name} <span className="opacity-75 text-xs">({p.species})</span>
                        </button>
                      ))}
                      {pets.length === 0 && (
                        <p className="text-xs text-slate-400 italic">No pets found for this client. Click "+ Add New Pet" to add one.</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* FLOW TYPE 1: PRODUCT BILLING ITEMS */}
          {flowType === 'PRODUCT' && (
            <div className="card card-body space-y-3">
              <h3 className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Add Products to Cart</span>
                <span className="text-xs text-slate-400 font-normal">Stock will be deducted upon payment</span>
              </h3>

              {/* Product Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="input pl-9"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => {
                    setShowProductDropdown(true);
                    productAPI.search(productSearch).then((r) => setProductResults(r.data.products || []));
                  }}
                  placeholder="Click to browse or search products by name, code, brand..."
                />
                {showProductDropdown && productResults.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                    <div className="p-2 bg-slate-50 border-b text-xs text-slate-500 font-semibold flex justify-between">
                      <span>{productSearch ? `Search Results (${productResults.length})` : `Available Products (${productResults.length})`}</span>
                      <button type="button" onClick={() => setShowProductDropdown(false)} className="text-slate-400 hover:text-slate-700">Close ✕</button>
                    </div>
                    {productResults.map((p) => {
                      const expired = p.expiryDate && new Date(p.expiryDate) < new Date();
                      const outOfStock = p.currentStock === 0;
                      return (
                        <button key={p._id} type="button" onClick={() => { addToCart(p); setShowProductDropdown(false); }}
                          disabled={expired || outOfStock}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-sm border-b last:border-0 disabled:opacity-50 text-left">
                          <div className="text-left">
                            <p className="font-medium text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.productCode} {p.brand ? `· ${p.brand}` : ''} · GST {p.gstRate}%</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-800">{formatCurrency(p.sellingPrice)}</p>
                            <p className={`text-xs ${outOfStock ? 'text-red-500' : expired ? 'text-red-500' : 'text-slate-500'}`}>
                              {expired ? 'Expired' : outOfStock ? 'Out of stock' : `Stock: ${p.currentStock}`}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cart Table */}
              {cart.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>GST</th><th>Line Total</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => {
                        const base = item.unitPrice * item.quantity - (item.discount || 0);
                        const gst = (base * item.gstRate) / 100;
                        const lineTotal = base + gst;
                        return (
                          <tr key={item.productId}>
                            <td>
                              <p className="font-medium text-slate-800">{item.productName}</p>
                              <p className="text-xs text-slate-400 font-mono">{item.productCode}</p>
                            </td>
                            <td>
                              <input type="number" min="1" max={item.currentStock} value={item.quantity}
                                onChange={(e) => updateCartItem(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                                className="input w-16 text-center text-sm py-1" />
                            </td>
                            <td className="text-money">{formatCurrency(item.unitPrice)}</td>
                            <td>
                              <input type="number" min="0" step="0.01" value={item.discount || ''}
                                onChange={(e) => updateCartItem(item.productId, 'discount', parseFloat(e.target.value) || 0)}
                                className="input w-20 text-sm py-1" placeholder="0" />
                            </td>
                            <td className="text-xs">
                              <span className="badge badge-blue">{item.gstRate}%</span>
                              <br /><span className="text-slate-500">{formatCurrency(gst)}</span>
                            </td>
                            <td className="text-money font-bold">{formatCurrency(lineTotal)}</td>
                            <td>
                              <button onClick={() => removeFromCart(item.productId)} className="text-slate-400 hover:text-red-600">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                  <p>Cart is empty. Search products above to add items.</p>
                </div>
              )}
            </div>
          )}

          {/* FLOW TYPE 2: CLINIC BILLING ITEMS */}
          {flowType === 'CLINIC' && (
            <div className="card card-body space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-700">Clinic Treatment & Service Items</h3>
                <button type="button" onClick={addClinicItem} className="btn btn-secondary btn-sm gap-1">
                  <PlusIcon className="h-4 w-4" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {clinicItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <label className="label text-xs">Category</label>
                        <select className="input text-sm" value={item.type} onChange={(e) => updateClinicItem(idx, 'type', e.target.value)}>
                          {['CONSULTATION', 'TREATMENT', 'EQUIPMENT', 'PRODUCT'].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-5">
                        <label className="label text-xs">Description *</label>
                        <input className="input text-sm" value={item.description}
                          onChange={(e) => updateClinicItem(idx, 'description', e.target.value)}
                          placeholder="e.g. Vaccination & Deworming" />
                      </div>
                      <div className="col-span-1">
                        <label className="label text-xs">Qty</label>
                        <input type="number" min="1" className="input text-sm text-center" value={item.quantity}
                          onChange={(e) => updateClinicItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="col-span-2">
                        <label className="label text-xs">Cost (₹) *</label>
                        <input type="number" min="0" step="0.01" className="input text-sm" value={item.unitCost}
                          onChange={(e) => updateClinicItem(idx, 'unitCost', e.target.value)} />
                      </div>
                      <div className="col-span-1 pt-5 text-right">
                        <button type="button" onClick={() => removeClinicItem(idx)} className="text-slate-400 hover:text-red-500">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="label">Doctor Notes / Treatment Details</label>
                <textarea className="input" rows={2} value={clinicNotes} onChange={(e) => setClinicNotes(e.target.value)}
                  placeholder="Record treatment summary or prescription notes..." />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT 1 COL: BILL SUMMARY & CONFIRMATION */}
        <div className="space-y-4">
          <div className="card card-body space-y-4 sticky top-6">
            <h3 className="font-semibold text-slate-700">Billing Summary</h3>

            {flowType === 'PRODUCT' ? (
              <>
                <div className="space-y-2 text-sm border-b pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">{formatCurrency(cartTotals.subtotal)}</span>
                  </div>
                  {cartTotals.itemDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Item Discounts</span>
                      <span className="text-red-600">- {formatCurrency(cartTotals.itemDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">GST (Calculated)</span>
                    <span className="font-medium text-blue-700">{formatCurrency(cartTotals.gst)}</span>
                  </div>
                </div>

                <div>
                  <label className="label text-xs">Overall Bill Discount (₹)</label>
                  <input className="input" type="number" min="0" step="0.01" value={overallDiscount}
                    onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)} placeholder="0.00" />
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total</span>
                    <span className="text-primary-700">{formatCurrency(grandTotal)}</span>
                  </div>
                  <p className="text-xs text-primary-600 mt-0.5">Includes all taxes & item discounts</p>
                </div>

                <div>
                  <label className="label">Payment Method *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['CASH', 'UPI', 'CARD'].map((m) => (
                      <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                        className={`btn text-sm py-2 ${paymentMethod === m ? 'btn-primary' : 'btn-secondary'}`}>
                        {m === 'CASH' ? '💵' : m === 'UPI' ? '📱' : '💳'} {m}
                      </button>
                    ))}
                  </div>
                </div>

                {(paymentMethod === 'UPI' || paymentMethod === 'CARD') && (
                  <div>
                    <label className="label text-xs">Transaction Reference / UTR</label>
                    <input className="input" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Ref number" />
                  </div>
                )}

                {paymentMethod === 'CASH' && (
                  <div>
                    <label className="label text-xs">Cash Received (₹)</label>
                    <input className="input" type="number" step="0.01" value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)} placeholder={grandTotal.toFixed(2)} />
                    {paidAmount && Number(paidAmount) >= grandTotal && (
                      <p className="text-xs text-green-600 mt-1 font-medium">Change: {formatCurrency(change)}</p>
                    )}
                  </div>
                )}

                <button
                  onClick={handleConfirmProductPayment}
                  disabled={submitting || cart.length === 0}
                  className="w-full btn btn-success btn-lg mt-2"
                >
                  {submitting ? 'Processing Payment...' : `✓ Confirm & Issue Invoice · ${formatCurrency(grandTotal)}`}
                </button>
              </>
            ) : (
              <>
                <div className="space-y-2 text-sm border-b pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Treatment Items</span>
                    <span className="font-medium">{clinicItems.length} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GST</span>
                    <span className="font-bold text-green-600">₹0.00 (NO GST)</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Clinic Total</span>
                    <span className="text-amber-800">{formatCurrency(clinicTotal)}</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-0.5">Internal record · Stored in pet history</p>
                </div>

                <button
                  onClick={handleConfirmClinicBilling}
                  disabled={submitting || !selectedClient || !selectedPet}
                  className="w-full btn btn-primary btn-lg mt-2"
                >
                  {submitting ? 'Saving Record...' : `✓ Save Clinic Record · ${formatCurrency(clinicTotal)}`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Register New Client Modal */}
      <Modal
        isOpen={showQuickRegisterModal}
        onClose={() => setShowQuickRegisterModal(false)}
        title="Register New Client & Pet"
        size="lg"
      >
        <form onSubmit={handleQuickRegisterClient} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
            💡 Registering a client here will automatically select them for this bill and store them in the common customer database.
          </div>

          <div className="form-grid">
            <div>
              <label className="label">Client Full Name *</label>
              <input
                className="input"
                value={quickClientForm.name}
                onChange={(e) => setQuickClientForm({ ...quickClientForm, name: e.target.value })}
                required
                placeholder="e.g. Ananya Sharma"
              />
            </div>
            <div>
              <label className="label">Mobile Number *</label>
              <input
                className="input"
                value={quickClientForm.mobile}
                onChange={(e) => setQuickClientForm({ ...quickClientForm, mobile: e.target.value })}
                required
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                className="input"
                type="email"
                value={quickClientForm.email}
                onChange={(e) => setQuickClientForm({ ...quickClientForm, email: e.target.value })}
                placeholder="ananya@example.com"
              />
            </div>
            <div>
              <label className="label">Address / Location</label>
              <input
                className="input"
                value={quickClientForm.address}
                onChange={(e) => setQuickClientForm({ ...quickClientForm, address: e.target.value })}
                placeholder="Area / Street name"
              />
            </div>
          </div>

          <div className="border-t pt-3 space-y-3">
            <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
              <span>🐶 Pet Details (Optional)</span>
            </h4>
            <div className="form-grid">
              <div>
                <label className="label">Pet Name</label>
                <input
                  className="input"
                  value={quickClientForm.petName}
                  onChange={(e) => setQuickClientForm({ ...quickClientForm, petName: e.target.value })}
                  placeholder="e.g. Max"
                />
              </div>
              <div>
                <label className="label">Species</label>
                <select
                  className="input"
                  value={quickClientForm.petSpecies}
                  onChange={(e) => setQuickClientForm({ ...quickClientForm, petSpecies: e.target.value })}
                >
                  {['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Turtle', 'Other'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Breed</label>
                <input
                  className="input"
                  value={quickClientForm.petBreed}
                  onChange={(e) => setQuickClientForm({ ...quickClientForm, petBreed: e.target.value })}
                  placeholder="e.g. Golden Retriever"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowQuickRegisterModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingQuickClient}
              className="btn btn-primary"
            >
              {savingQuickClient ? 'Registering...' : '✓ Register & Select for Bill'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
