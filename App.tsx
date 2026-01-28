
import React, { useState, useEffect } from 'react';
import { InvoiceData, InvoiceItem, RecipientInfo } from './types';
import { COMPANY_INFO } from './constants';
import { generatePDF } from './services/pdfService';

const INITIAL_RECIPIENT: RecipientInfo = {
  companyName: '',
  address: '',
  phone: '',
  email: ''
};

const formatDate = (date: Date) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InvoiceData>(() => {
    const today = new Date();
    const due = new Date();
    due.setDate(today.getDate() + 30);

    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');

    return {
      documentType: 'INVOICE',
      invoiceNumber: dateStr + randomSuffix,
      date: formatDate(today),
      dateDue: formatDate(due),
      billingRecipient: { ...INITIAL_RECIPIENT },
      shippingRecipient: { ...INITIAL_RECIPIENT },
      shippingSameAsBilling: true,
      items: [{ id: crypto.randomUUID(), description: 'Fundamental EE Core', qty: 1, unitPrice: 673, total: 673 }],
      subtotal: 673,
      shipping: 0,
      gstLabel: COMPANY_INFO.gstLabel,
      gstRate: 5,
      pstLabel: COMPANY_INFO.pstLabel,
      pstRate: 7,
      gst: 0,
      pst: 0,
      totalDue: 673,
      currency: 'US$'
    };
  });

  // Auto-calculate totals
  useEffect(() => {
    const subtotal = data.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const gstRate = Number(data.gstRate) || 0;
    const pstRate = Number(data.pstRate) || 0;
    const gst = subtotal * (gstRate / 100);
    const pst = subtotal * (pstRate / 100);
    const shipping = Number(data.shipping) || 0;
    const totalDue = subtotal + gst + pst + shipping;

    setData(prev => ({
      ...prev,
      subtotal,
      gst,
      pst,
      totalDue
    }));
  }, [data.items, data.shipping, data.gstRate, data.pstRate]);

  // Sync shipping if toggle is on
  useEffect(() => {
    if (data.shippingSameAsBilling) {
      setData(prev => ({
        ...prev,
        shippingRecipient: { ...prev.billingRecipient }
      }));
    }
  }, [data.billingRecipient, data.shippingSameAsBilling]);

  const handleDocumentTypeChange = (type: 'INVOICE' | 'QUOTE') => {
    setData(prev => {
      let newNumber = prev.invoiceNumber;
      if (type === 'QUOTE' && !newNumber.endsWith('Q')) {
        newNumber += 'Q';
      } else if (type === 'INVOICE' && newNumber.endsWith('Q')) {
        newNumber = newNumber.slice(0, -1);
      }
      return { ...prev, documentType: type, invoiceNumber: newNumber };
    });
  };

  const handleAddItem = () => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), description: '', qty: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const handleRemoveItem = (id: string) => {
    if (data.items.length === 1) return;
    setData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          let val = value;
          if (field === 'qty' || field === 'unitPrice') {
            val = value === '' ? 0 : parseFloat(value as string);
          }
          const newItem = { ...item, [field]: val };
          newItem.total = (Number(newItem.qty) || 0) * (Number(newItem.unitPrice) || 0);
          return newItem;
        }
        return item;
      })
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generatePDF(data);
    } catch (error) {
      console.error(error);
      alert('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="eim-form-container" className="min-h-screen p-2 md:p-8 flex flex-col items-center bg-[#f3f4f6] pb-24 md:pb-8">
      <div className="max-w-4xl w-full bg-white shadow-lg p-4 md:p-12 mb-8 relative">
        
        {/* Document Type Selector - Now responsive sticky at top mobile */}
        <div className="sticky top-0 md:absolute md:top-4 left-1/2 -translate-x-1/2 flex gap-2 md:gap-4 bg-white/90 md:bg-gray-50 p-1 rounded-full border border-gray-200 z-30 shadow-sm backdrop-blur-sm">
          <button 
            onClick={() => handleDocumentTypeChange('INVOICE')}
            className={`px-4 md:px-6 py-1.5 rounded-full text-[10px] md:text-xs font-black tracking-widest transition-all ${data.documentType === 'INVOICE' ? 'bg-[#0056b3] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            INVOICE
          </button>
          <button 
            onClick={() => handleDocumentTypeChange('QUOTE')}
            className={`px-4 md:px-6 py-1.5 rounded-full text-[10px] md:text-xs font-black tracking-widest transition-all ${data.documentType === 'QUOTE' ? 'bg-[#0056b3] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            QUOTE
          </button>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8 md:mb-12 mt-4 md:mt-8">
          <div className="flex flex-col gap-4 w-full md:w-auto">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#0056b3] flex items-center justify-center mx-auto md:mx-0">
              <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20M7 7l10 10M7 17L17 7" />
              </svg>
            </div>
            <div className="text-center md:text-left text-sm text-gray-800 space-y-0.5">
              <p className="font-bold text-base">{COMPANY_INFO.name}</p>
              <p>{COMPANY_INFO.address}</p>
              <p>{COMPANY_INFO.city}</p>
              <p className="text-blue-600 underline cursor-pointer">{COMPANY_INFO.email}</p>
              <p><span className="font-semibold">Business Number:</span> {COMPANY_INFO.businessNumber}</p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right w-full md:w-auto">
            <h2 className="text-4xl md:text-5xl font-light text-gray-300 tracking-wider mb-2 uppercase">{data.documentType}</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold text-gray-900 w-full max-w-xs md:max-w-none">
              <span className="text-gray-400 uppercase self-center">{data.documentType === 'INVOICE' ? 'INV#' : 'QUO#'}</span>
              <input 
                className="text-right border-b border-gray-100 focus:border-blue-500 outline-none w-full md:w-32 bg-transparent" 
                value={data.invoiceNumber}
                onChange={e => setData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              />
              <span className="text-gray-400 uppercase self-center">Date</span>
              <input 
                className="text-right border-b border-gray-100 focus:border-blue-500 outline-none w-full md:w-32 bg-transparent" 
                value={data.date}
                onChange={e => setData(prev => ({ ...prev, date: e.target.value }))}
              />
              <span className="text-gray-400 uppercase self-center">Due</span>
              <input 
                className="text-right border-b border-gray-100 focus:border-blue-500 outline-none w-full md:w-32 bg-transparent" 
                value={data.dateDue}
                onChange={e => setData(prev => ({ ...prev, dateDue: e.target.value }))}
              />
            </div>
            
            {/* Amount Due Box */}
            <div className="mt-4 md:mt-6 border border-gray-300 px-6 py-3 w-full md:min-w-[200px] text-center bg-gray-50/50">
              <span className="text-sm font-black text-gray-900 uppercase">Amount Due: <br className="md:hidden" /> {data.currency} {(Number(data.totalDue) || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8 md:mb-12">
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b pb-1">Billing Recipient</h3>
            <input placeholder="Company / Name" className="w-full p-2 text-sm border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={data.billingRecipient.companyName} onChange={e => setData(prev => ({...prev, billingRecipient: {...prev.billingRecipient, companyName: e.target.value}}))} />
            <textarea placeholder="Address" rows={2} className="w-full p-2 text-sm border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={data.billingRecipient.address} onChange={e => setData(prev => ({...prev, billingRecipient: {...prev.billingRecipient, address: e.target.value}}))} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input placeholder="Phone" className="w-full p-2 text-sm border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={data.billingRecipient.phone} onChange={e => setData(prev => ({...prev, billingRecipient: {...prev.billingRecipient, phone: e.target.value}}))} />
              <input placeholder="Email" className="w-full p-2 text-sm border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={data.billingRecipient.email} onChange={e => setData(prev => ({...prev, billingRecipient: {...prev.billingRecipient, email: e.target.value}}))} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-1">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Shipping Recipient</h3>
              <label className="text-[10px] text-blue-600 font-bold flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={data.shippingSameAsBilling} onChange={e => setData(prev => ({...prev, shippingSameAsBilling: e.target.checked}))} />
                SAME AS BILLING
              </label>
            </div>
            <div className={`space-y-3 transition-opacity ${data.shippingSameAsBilling ? 'opacity-40 pointer-events-none' : ''}`}>
              <input placeholder="Company / Name" className="w-full p-2 text-sm border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={data.shippingRecipient.companyName} onChange={e => setData(prev => ({...prev, shippingRecipient: {...prev.shippingRecipient, companyName: e.target.value}}))} />
              <textarea placeholder="Address" rows={2} className="w-full p-2 text-sm border-gray-200 focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={data.shippingRecipient.address} onChange={e => setData(prev => ({...prev, shippingRecipient: {...prev.shippingRecipient, address: e.target.value}}))} />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 text-sm">
            <thead className="bg-white border-b border-gray-200 hidden md:table-header-group">
              <tr className="text-xs font-bold uppercase text-gray-500">
                <th className="p-3 border border-gray-200 text-center">Description</th>
                <th className="p-3 border border-gray-200 text-center w-24">Qty</th>
                <th className="p-3 border border-gray-200 text-center w-32">Unit Price</th>
                <th className="p-3 border border-gray-200 text-center w-32">Total</th>
                <th className="p-1 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(item => (
                <tr key={item.id} className="border-b border-gray-100 md:border-none">
                  <td className="p-1 border border-gray-200" data-label="Description">
                    <input className="w-full p-2 border-none bg-transparent outline-none focus:bg-gray-50 text-sm" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Item description" />
                  </td>
                  <td className="p-1 border border-gray-200" data-label="Qty">
                    <input type="number" className="w-full p-2 border-none bg-transparent text-center outline-none focus:bg-gray-50" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} />
                  </td>
                  <td className="p-1 border border-gray-200" data-label="Price">
                    <input type="number" className="w-full p-2 border-none bg-transparent text-right outline-none focus:bg-gray-50" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} />
                  </td>
                  <td className="p-3 border border-gray-200 text-right font-medium text-gray-700 bg-gray-50/20" data-label="Total">
                    {data.currency}{(Number(item.total) || 0).toFixed(2)}
                  </td>
                  <td className="p-2 text-center flex md:table-cell justify-center">
                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-300 hover:text-red-500 transition-colors p-2 text-xl md:text-base">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleAddItem} className="mt-4 p-2 w-full md:w-auto md:mt-2 text-[10px] font-black text-blue-600 hover:underline uppercase tracking-wider border md:border-none border-blue-100 rounded md:rounded-none">+ Add Line Item</button>
        </div>

        {/* Currency Selector */}
        <div className="mb-8 flex items-center justify-center md:justify-start gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/30 p-2 rounded">
          <span>Currency:</span>
          <select value={data.currency} onChange={e => setData(prev => ({ ...prev, currency: e.target.value }))} className="border border-gray-200 p-1 rounded text-gray-600 outline-none bg-white">
            <option value="US$">US$</option>
            <option value="CA$">CA$</option>
            <option value="$">$</option>
          </select>
        </div>

        {/* Footer Area with Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div className="text-[11px] text-gray-500 space-y-3 flex-grow max-w-sm order-2 md:order-1">
            <p className="border-l-2 border-blue-100 pl-3">Make all checks payable to <br/><span className="font-bold text-gray-900">{COMPANY_INFO.name}</span></p>
            <p className="border-l-2 border-blue-100 pl-3">Interac e-Transfer: <br/><span className="text-blue-600 font-bold">evoinmotion@gmail.com</span></p>
            <p className="border-l-2 border-blue-100 pl-3">Support POS payment for Credit Card, Alipay and Wechat, payable to EIM Technology</p>
            <div className="pt-8 text-base md:text-lg font-black text-gray-800 text-center italic tracking-widest w-full">
              THANK YOU FOR YOUR BUSINESS!
            </div>
          </div>

          <div className="w-full md:w-[320px] order-1 md:order-2">
            <div className="grid grid-cols-2 border border-gray-200 text-[11px] font-bold uppercase overflow-hidden bg-white shadow-sm">
              <div className="p-3 border-r border-b border-gray-100 text-right text-gray-400">Subtotal</div>
              <div className="p-3 border-b border-gray-100 text-right text-gray-800">{data.currency}{(Number(data.subtotal) || 0).toFixed(2)}</div>
              
              <div className="p-3 border-r border-b border-gray-100 text-right text-gray-400">Shipping</div>
              <div className="p-3 border-b border-gray-100 text-right">
                <input 
                  type="number" 
                  className="w-full text-right outline-none bg-transparent font-bold text-gray-800" 
                  placeholder="N/A"
                  value={data.shipping || ''}
                  onChange={e => setData(prev => ({ ...prev, shipping: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                />
              </div>

              <div className="p-2 border-r border-b border-gray-100 bg-gray-50/50 flex flex-col items-end justify-center">
                <input 
                  className="w-full text-right bg-transparent outline-none text-blue-600 italic font-bold mb-1" 
                  value={data.gstLabel} 
                  onChange={e => setData(prev => ({ ...prev, gstLabel: e.target.value }))}
                />
                <div className="flex items-center gap-1 text-[9px] text-gray-400">
                  <span>RATE:</span>
                  <input 
                    type="number"
                    className="w-10 text-right bg-white border border-gray-200 p-0.5 rounded"
                    value={data.gstRate} 
                    onChange={e => setData(prev => ({ ...prev, gstRate: parseFloat(e.target.value) || 0 }))}
                  />
                  <span>%</span>
                </div>
              </div>
              <div className="p-3 border-b border-gray-100 text-right text-gray-600 bg-gray-50/50 flex items-center justify-end font-bold">
                {data.currency}{(Number(data.gst) || 0).toFixed(2)}
              </div>
              
              <div className="p-2 border-r border-b border-gray-100 bg-gray-50/50 flex flex-col items-end justify-center">
                <input 
                  className="w-full text-right bg-transparent outline-none text-blue-600 italic font-bold mb-1" 
                  value={data.pstLabel} 
                  onChange={e => setData(prev => ({ ...prev, pstLabel: e.target.value }))}
                />
                <div className="flex items-center gap-1 text-[9px] text-gray-400">
                  <span>RATE:</span>
                  <input 
                    type="number"
                    className="w-10 text-right bg-white border border-gray-200 p-0.5 rounded"
                    value={data.pstRate} 
                    onChange={e => setData(prev => ({ ...prev, pstRate: parseFloat(e.target.value) || 0 }))}
                  />
                  <span>%</span>
                </div>
              </div>
              <div className="p-3 border-b border-gray-100 text-right text-gray-600 bg-gray-50/50 flex items-center justify-end font-bold">
                {data.currency}{(Number(data.pst) || 0).toFixed(2)}
              </div>

              <div className="p-4 border-r border-gray-200 text-right text-gray-900 bg-[#f8fafc] font-black text-xs">Total Due</div>
              <div className="p-4 text-right text-gray-900 font-black text-base bg-[#f8fafc]">
                {data.currency}{(Number(data.totalDue) || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
        <div className="mt-12 md:mt-20 flex justify-center md:justify-end w-full border-t border-gray-100 pt-4">
          <div className="text-center md:text-right text-[10px] text-gray-400 space-y-0.5">
            <p className="font-bold uppercase">Copyright © 2025 by EVO-IN-MOTION TECHNOLOGY LTD. All rights reserved.</p>
            <p className="text-blue-500 font-bold">www.eimtechnology.com</p>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Enhanced for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 md:relative md:bg-transparent md:border-none md:p-0 flex justify-center z-40">
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className={`
            w-full md:w-auto px-10 py-4 rounded-full text-white font-bold shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0056b3] hover:bg-[#004494]'}
          `}
        >
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {loading ? 'Processing...' : `Generate ${data.documentType} PDF`}
        </button>
      </div>
    </div>
  );
};

export default App;
