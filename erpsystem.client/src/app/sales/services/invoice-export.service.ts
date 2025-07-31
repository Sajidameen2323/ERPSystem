import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { InvoiceService } from './invoice.service';
import { Invoice, InvoiceStatus } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceExportService {
  private readonly invoiceService = inject(InvoiceService);

  /**
   * Downloads invoice as PDF from backend
   */
  downloadInvoicePdf(invoiceId: string): Observable<boolean> {
    return this.invoiceService.downloadInvoicePdf(invoiceId).pipe(
      map((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoiceId.slice(0, 8)}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        return true;
      }),
      catchError((error) => {
        console.error('Error downloading PDF:', error);
        return of(false);
      })
    );
  }

  /**
   * Exports invoices to Excel from backend
   */
  exportInvoicesToExcel(): Observable<boolean> {
    return this.invoiceService.exportInvoicesToExcel().pipe(
      map((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoices-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        return true;
      }),
      catchError((error) => {
        console.error('Error exporting to Excel:', error);
        return of(false);
      })
    );
  }

  /**
   * Generates PDF from HTML element using client-side libraries
   */
  async generatePdfFromElement(element: HTMLElement, fileName: string): Promise<boolean> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fileName);
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return false;
    }
  }

  /**
   * Creates Excel file from invoice data
   */
  exportInvoiceToExcel(invoice: Invoice): boolean {
    try {
      const workbook = XLSX.utils.book_new();

      // Invoice summary data
      const summaryData = [
        ['Invoice Number', invoice.invoiceNumber],
        ['Customer', invoice.customerName],
        ['Email', invoice.customerEmail],
        ['Sales Order', invoice.salesOrderReferenceNumber],
        ['Status', this.getStatusText(invoice.status)],
        ['Invoice Date', new Date(invoice.invoiceDate).toLocaleDateString()],
        ['Due Date', new Date(invoice.dueDate).toLocaleDateString()],
        [''],
        ['Subtotal', `$${invoice.subTotal.toFixed(2)}`],
        ['Tax Amount', `$${invoice.taxAmount.toFixed(2)}`],
        ['Discount', `$${invoice.discountAmount.toFixed(2)}`],
        ['Total Amount', `$${invoice.totalAmount.toFixed(2)}`],
        ['Paid Amount', `$${invoice.paidAmount.toFixed(2)}`],
        ['Balance Due', `$${invoice.balanceAmount.toFixed(2)}`],
      ];

      if (invoice.notes) {
        summaryData.push([''], ['Notes', invoice.notes]);
      }

      if (invoice.terms) {
        summaryData.push([''], ['Terms', invoice.terms]);
      }

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Invoice Summary');

      // Invoice items data
      const itemsData = [
        ['Product Name', 'Description', 'Quantity', 'Unit Price', 'Line Total']
      ];

      invoice.invoiceItems.forEach(item => {
        itemsData.push([
          item.productName,
          item.description || '',
          item.quantity.toString(),
          `$${item.unitPrice.toFixed(2)}`,
          `$${item.lineTotal.toFixed(2)}`
        ]);
      });

      const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Invoice Items');

      // Save file
      XLSX.writeFile(workbook, `invoice-${invoice.invoiceNumber}.xlsx`);
      return true;
    } catch (error) {
      console.error('Error creating Excel file:', error);
      return false;
    }
  }

  /**
   * Prints invoice using browser print functionality
   */
  printInvoice(invoice: Invoice, printElementId: string = 'invoice-print-area'): boolean {
    try {
      // First try to find the print area
      let printArea = document.getElementById(printElementId);
      
      // If not found, try alternative selectors
      if (!printArea) {
        printArea = document.querySelector('.invoice-template');
      }
      
      if (!printArea) {
        printArea = document.querySelector('app-invoice-template');
      }
      
      if (!printArea) {
        console.error('Print area not found with any selector');
        // Fallback: Generate print content directly from invoice data
        return this.printInvoiceDirectly(invoice);
      }

      // Create print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.error('Unable to open print window');
        return false;
      }

      // Generate print-optimized HTML
      const printContent = this.generatePrintHtml(invoice, printArea.innerHTML);
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      return true;
    } catch (error) {
      console.error('Error printing invoice:', error);
      return false;
    }
  }

  /**
   * Converts numeric invoice status to readable string
   */
  private getStatusText(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.Draft:
        return 'Draft';
      case InvoiceStatus.Sent:
        return 'Sent';
      case InvoiceStatus.Paid:
        return 'Paid';
      case InvoiceStatus.PartiallyPaid:
        return 'Partially Paid';
      case InvoiceStatus.Overdue:
        return 'Overdue';
      case InvoiceStatus.Cancelled:
        return 'Cancelled';
      case InvoiceStatus.RefundRequested:
        return 'Refund Requested';
      case InvoiceStatus.Refunded:
        return 'Refunded';
      default:
        return 'Unknown';
    }
  }

  /**
   * Fallback method to print invoice when DOM element is not available
   */
  private printInvoiceDirectly(invoice: Invoice): boolean {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.error('Unable to open print window');
        return false;
      }

      // Generate complete invoice HTML from data
      const invoiceHtml = this.generateCompleteInvoiceHtml(invoice);
      
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      return true;
    } catch (error) {
      console.error('Error in direct print:', error);
      return false;
    }
  }

  /**
   * Generates complete invoice HTML from invoice data
   */
  private generateCompleteInvoiceHtml(invoice: Invoice): string {
    const invoiceItems = invoice.invoiceItems.map(item => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.description || ''}</td>
        <td class="number">${item.quantity}</td>
        <td class="number">$${item.unitPrice.toFixed(2)}</td>
        <td class="number">$${item.lineTotal.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
            color: #333;
            font-size: 12px;
            line-height: 1.4;
          }
          .invoice-header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .company-info h1 { 
            margin: 0; 
            color: #2563eb; 
            font-size: 24px;
          }
          .company-info p { 
            margin: 2px 0; 
            color: #666;
          }
          .invoice-info { 
            text-align: right; 
          }
          .invoice-info h2 { 
            margin: 0; 
            font-size: 28px; 
            color: #333;
          }
          .invoice-details { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
          }
          .bill-to h3, .sales-order h3 { 
            margin: 0 0 10px 0; 
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .sales-order { 
            text-align: right; 
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          .items-table th, .items-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
            font-size: 11px;
          }
          .items-table th { 
            background-color: #f8f9fa; 
            font-weight: bold;
            color: #333;
          }
          .items-table td.number { 
            text-align: right; 
          }
          .totals { 
            float: right; 
            width: 300px; 
          }
          .totals table { 
            width: 100%; 
            border-collapse: collapse; 
          }
          .totals td { 
            padding: 6px; 
            border-bottom: 1px solid #eee; 
            font-size: 11px;
          }
          .totals .total-row { 
            font-weight: bold; 
            border-top: 2px solid #333; 
            background-color: #f8f9fa;
          }
          .terms-notes { 
            clear: both; 
            margin-top: 40px; 
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 10px;
          }
          .terms-notes h4 { 
            margin: 0 0 10px 0; 
            color: #333;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
        </style>
      </head>
      <body>
        <div class="invoice-template">
          <!-- Company Header -->
          <div class="invoice-header">
            <div class="company-info">
              <h1>ERP System Company</h1>
              <p>123 Business Street</p>
              <p>Business City, BC 12345</p>
              <p>Phone: (555) 123-4567</p>
              <p>Email: info@erpsystem.com</p>
              <p>Website: www.erpsystem.com</p>
            </div>
            <div class="invoice-info">
              <h2>INVOICE</h2>
              <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${this.getStatusText(invoice.status)}</p>
            </div>
          </div>

          <!-- Customer and Sales Order Information -->
          <div class="invoice-details">
            <div class="bill-to">
              <h3>Bill To:</h3>
              <p><strong>${invoice.customerName}</strong></p>
              ${invoice.customerEmail ? `<p>${invoice.customerEmail}</p>` : ''}
            </div>
            <div class="sales-order">
              ${invoice.salesOrderReferenceNumber ? `
                <h3>Sales Order:</h3>
                <p><strong>Reference:</strong> ${invoice.salesOrderReferenceNumber}</p>
                ${invoice.salesOrderId ? `<p><strong>Order ID:</strong> ${invoice.salesOrderId}</p>` : ''}
              ` : ''}
            </div>
          </div>

          <!-- Invoice Items -->
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceItems}
            </tbody>
          </table>

          <!-- Totals -->
          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td class="number">$${invoice.subTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Tax:</td>
                <td class="number">$${invoice.taxAmount.toFixed(2)}</td>
              </tr>
              ${invoice.discountAmount > 0 ? `
                <tr>
                  <td>Discount:</td>
                  <td class="number">-$${invoice.discountAmount.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td><strong>Total:</strong></td>
                <td class="number"><strong>$${invoice.totalAmount.toFixed(2)}</strong></td>
              </tr>
              ${invoice.paidAmount > 0 ? `
                <tr>
                  <td>Amount Paid:</td>
                  <td class="number">$${invoice.paidAmount.toFixed(2)}</td>
                </tr>
              ` : ''}
              ${invoice.balanceAmount > 0 ? `
                <tr>
                  <td><strong>Balance Due:</strong></td>
                  <td class="number"><strong>$${invoice.balanceAmount.toFixed(2)}</strong></td>
                </tr>
              ` : ''}
            </table>
          </div>

          <!-- Terms and Notes -->
          ${invoice.terms || invoice.notes ? `
            <div class="terms-notes">
              ${invoice.terms ? `
                <div>
                  <h4>Terms & Conditions:</h4>
                  <p>${invoice.terms}</p>
                </div>
              ` : ''}
              ${invoice.notes ? `
                <div>
                  <h4>Notes:</h4>
                  <p>${invoice.notes}</p>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates print-optimized HTML for invoice
   */
  private generatePrintHtml(invoice: Invoice, content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
            color: #333;
            font-size: 12px;
            line-height: 1.4;
          }
          .invoice-header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .company-info h1 { 
            margin: 0; 
            color: #2563eb; 
            font-size: 24px;
          }
          .company-info p { 
            margin: 2px 0; 
            color: #666;
          }
          .invoice-info { 
            text-align: right; 
          }
          .invoice-info h2 { 
            margin: 0; 
            font-size: 28px; 
            color: #333;
          }
          .invoice-details { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
          }
          .bill-to h3, .sales-order h3 { 
            margin: 0 0 10px 0; 
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .sales-order { 
            text-align: right; 
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          .items-table th, .items-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
            font-size: 11px;
          }
          .items-table th { 
            background-color: #f8f9fa; 
            font-weight: bold;
            color: #333;
          }
          .items-table td.number { 
            text-align: right; 
          }
          .totals { 
            float: right; 
            width: 300px; 
          }
          .totals table { 
            width: 100%; 
            border-collapse: collapse; 
          }
          .totals td { 
            padding: 6px; 
            border-bottom: 1px solid #eee; 
            font-size: 11px;
          }
          .totals .total-row { 
            font-weight: bold; 
            border-top: 2px solid #333; 
            background-color: #f8f9fa;
          }
          .terms-notes { 
            clear: both; 
            margin-top: 40px; 
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 10px;
          }
          .terms-notes h4 { 
            margin: 0 0 10px 0; 
            color: #333;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
  }
}
