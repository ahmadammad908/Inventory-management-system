# Retail Pro - Pakistani Inventory Management & POS System 🇵🇰

A modern, responsive, and production-ready **Inventory Management & Point of Sale (POS)** system designed specifically for local Pakistani retail businesses (super marts, general stores, grocery shops, and wholesale traders).

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Lucide Icons**, and **LocalStorage** for persistent, zero-configuration local database storage with multi-tab synchronization.

---

## 🌟 Key Features

### 1. 🛒 POS & Quick Billing Screen
- **Physical USB Barcode Scanner Support**: Auto-focused search input listening for high-speed USB scanner inputs with instant `Enter` key detection and item addition.
- **Webcam Barcode Scanner**: Integrated `html5-qrcode` camera barcode reader for scanning with laptops, phones, or tablets with audio confirmation beep.
- **Touch Product Catalog**: Responsive product card grid with category pills, out-of-stock disable indicators, and search filter.
- **Cart Management**:
  - Quantity controls (`+`, `-`, direct numeric input)
  - Line-item flat PKR discount
  - Bill-level discount and customizable sales tax
  - Hold / Park active carts to handle multiple waiting customers
- **Pakistani Payment Types**:
  - **Cash Counter**: Fast cash buttons (`Exact`, `Rs. 500`, `Rs. 1,000`, `Rs. 5,000`) and live **Change Due** calculator.
  - **Mobile Wallets**: JazzCash & EasyPaisa with TID / reference input.
  - **Bank Card**: POS terminal authorization tracking.
  - **Udhaar (Credit)**: Direct billing to customer Khata with credit limit verification.
- **80mm Thermal Receipt Printer**:
  - Itemized receipt layout with store name, NTN, STRN, cashier, date/time, Urdu disclaimer (`شکریہ!`), and barcode.
  - One-click `window.print()` with dedicated `@media print` CSS isolating only the receipt.

### 2. 📦 Inventory & Stock Master (Item Master)
- Search by SKU or item name, filter by category and stock level (In Stock, Low Stock, Out of Stock).
- Add/Edit product modal with real-time **Profit Margin %** calculation.
- Auto-generated Code128 barcodes with single or bulk sticker sheet printing (1, 4, 6, 12, 24 labels).
- Manual stock adjustments (Shipment received, damage write-off, audit reconciliation).
- Export inventory to CSV.

### 3. 📒 Customer Khata / Udhaar Ledger
- Comprehensive customer database with Phone, Address, CNIC, and Credit Limits.
- Outstanding Khata balance tracking with color-coded alerts.
- Chronological transaction history (debit purchases and credit payments).
- "Receive Payment" modal for clearing Udhaar.
- **One-Click WhatsApp Reminder**: Direct `https://wa.me/` integration generating a polite Urdu/English payment reminder containing due balance and store details.

### 4. 📊 Dashboard & Financial Analytics
- KPI Summary Cards: Total Inventory Valuation, Today's Sales, Today's Gross Profit, and Khata Receivables.
- Visual charts: Top 5 Best-Selling Products by revenue, Payment method breakdown share.
- Low stock reorder list with one-click print or CSV download.
- Full sales transaction log with ability to void/refund sales and restock items.

### 5. ⚙️ Settings, LocalStorage & JSON Backup
- Store branding customization (Store Name, Phone, Address, City, NTN, STRN, Receipt Footer).
- **Seed Sample Pakistani Data**: One-click button to load realistic Pakistani grocery products (Shan Masalas, Tapal Tea, Olper's Milk, Rooh Afza, Dalda Ghee, Guard Rice, Lifebuoy, Surf Excel, etc.).
- **JSON Backup & Restore**: Download complete offline database backup and restore on any browser or PC.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `F2` or `/` | Auto-focus Barcode / Product Search input in POS |
| `F4` | Open Payment & Checkout Modal when cart has items |
| `Ctrl + P` | Print Thermal Receipt or Barcode sheet |
| `Esc` | Close any open modal / suggestion dropdown |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 📁 Project Architecture

```
├── app/
│   ├── globals.css           # Tailwind directives & @media print styles
│   ├── layout.tsx            # Root layout with metadata & fonts
│   ├── page.tsx              # Executive Dashboard
│   ├── pos/page.tsx          # POS Billing Screen
│   ├── inventory/page.tsx    # Inventory Master Table
│   ├── khata/page.tsx        # Customer Khata & Udhaar Ledger
│   ├── reports/page.tsx      # Sales Reports & Audit Log
│   └── settings/page.tsx     # Store Profile, Backup & Restore
├── components/
│   ├── barcode/
│   │   ├── BarcodeDisplay.tsx       # Crisp SVG/Canvas Code128 Barcodes
│   │   └── CameraScannerModal.tsx   # Live webcam barcode scanner
│   ├── common/
│   │   ├── AppLayoutClient.tsx      # Shell layout wrapper
│   │   ├── Header.tsx               # Store banner, live clock & actions
│   │   ├── Sidebar.tsx              # High-contrast navigation
│   │   ├── Modal.tsx                # Accessible modal dialog
│   │   └── Badge.tsx                # Status badges
│   ├── dashboard/
│   │   └── DashboardView.tsx        # KPI cards & visual analytics
│   ├── inventory/
│   │   ├── InventoryView.tsx        # Searchable inventory master
│   │   ├── ProductModal.tsx         # Add/Edit product with margin preview
│   │   ├── StockAdjustmentModal.tsx # Manual stock in/out adjustments
│   │   └── PrintBarcodeModal.tsx    # Printable barcode sticker sheets
│   ├── khata/
│   │   ├── KhataView.tsx            # Customer directory & balances
│   │   ├── CustomerModal.tsx        # Customer profile registration
│   │   ├── CustomerLedgerModal.tsx  # Detailed transaction history & WhatsApp reminder
│   │   └── PaymentModal.tsx         # Record cash/online Udhaar repayments
│   ├── pos/
│   │   ├── POSView.tsx              # Master POS container
│   │   ├── BarcodeScannerInput.tsx  # USB scanner listener & search
│   │   ├── ProductCatalogGrid.tsx   # Touch-friendly product cards
│   │   ├── CartList.tsx             # Line items, discounts, hold orders
│   │   ├── CheckoutModal.tsx        # Cash tender, JazzCash/EP, Udhaar
│   │   └── ThermalReceipt.tsx       # 80mm printable thermal receipt
│   └── reports/
│       └── ReportsView.tsx          # Sales register, profit margin & reorder sheet
├── context/
│   └── AppContext.tsx               # Central reactive state & custom hooks
├── lib/
│   ├── storage/
│   │   ├── sample-data.ts           # Authentic Pakistani grocery dataset
│   │   └── storage-manager.ts       # LocalStorage APIs, events, backup/restore
│   └── utils.ts                     # formatPKR, barcode & invoice generators
└── types/
    └── index.ts                     # TypeScript data contracts & schemas
```
