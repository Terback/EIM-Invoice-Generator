<div align="center">
  <img width="1200" height="475" alt="EIM Banner"
       src="https://github.com/Terback/Images/blob/main/logo/logo%20color%20palette-website-01.png?raw=true" />
</div>



# EIM Invoice Generator

A lightweight, browser-based invoice generator designed for fast, structured, and professional invoice creation. Built specifically for hardware-oriented workflows where speed, clarity, and exportability matter.

---

## Overview

EIM Invoice Generator is a simple yet practical tool that allows users to create clean, structured invoices and export them as PDF files directly from the browser.

This project was originally developed to support internal operations at EIM Technology, where generating invoices quickly for hardware kits, educational bundles, and bulk orders is a daily requirement.

Instead of relying on complex accounting software, this tool focuses on:

* Speed
* Simplicity
* Clean output
* Zero backend dependency

---

## Why This Exists

In hardware and education product workflows, invoice generation often becomes a bottleneck:

* Repetitive manual entry
* Inconsistent formatting
* Slow export process
* Overkill tools for simple needs

This tool was built to solve a very specific problem:

> Generate a professional invoice in under 30 seconds.

It removes unnecessary complexity while preserving the essentials required for real-world use.

---

## Features

* Browser-based, no installation required
* Instant PDF generation using jsPDF
* Structured invoice layout (clean and consistent)
* Dynamic item table with automatic calculations
* Lightweight UI built with TailwindCSS
* Fully client-side, no data is stored

---

## Tech Stack

* Frontend: HTML, React, TailwindCSS
* PDF Engine: jsPDF, jsPDF-AutoTable
* Runtime: Browser (no backend required)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

### 3. Open in browser

```
invoice.eimtechnology.com
```

---

## Usage

1. Enter customer information
2. Add invoice items (name, quantity, price)
3. Adding shipment if needed
4. Review calculated totals
5. implement tax if required (for example BC has 5% GST and 7% PST)
6. Click “Generate PDF”
7. Download and send

The entire workflow is designed to be completed in seconds.

---

## Project Structure

```
/src
  /components
  /services
  /utils
/public
```

* components: UI elements and invoice layout
* services: PDF generation logic
* utils: calculation and formatting helpers

---

## Design Philosophy

This project follows a few core principles:

### 1. Minimal but Complete

Only include what is necessary for real invoice generation.

### 2. Speed First

Every interaction should feel instant.

### 3. No Backend Dependency

Invoices are generated fully on the client side.

### 4. Practical Over Perfect

Designed for daily operational use, not theoretical completeness.

---

## Future Improvements

* Customer database (auto-fill)
* Product presets (for recurring items)
* Tax and shipping calculation modules
* Invoice history and local storage
* Multi-currency support

---

## Use Cases

* Hardware product sales
* Educational kit distribution
* Small business invoicing
* Internal operations tools

---

## License

MIT License

---

## Author

Developed by Terrence Dai
EIM Technology

---

## Contributing

This project is currently maintained as a focused internal tool.
Suggestions and improvements are welcome, but the scope will remain intentionally minimal.
