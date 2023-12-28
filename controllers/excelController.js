const Order = require('../models/orderModel')
const excelJS = require("exceljs");
const fs = require("fs");
const path = require("path")

//function to generate PDF for user oder invoice

const getExcelSalesReport = async (req, res) => {
    try {
      const orders = await Order.find({ paymentStatus: "Payment Successful" })
        .populate('user', 'email') 
        .populate({
          path: 'items.product',
          model: 'product',
        })
        .populate('address');

  
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');
      let serialNumber = 1;
  
      worksheet.columns = [
        { header: 'Serial Number', key: 'Sno', width: 10 },
        { header: 'UserID', key: 'userId', width: 10 },
        { header: 'Order Date', key: 'orderDate', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
        { header: 'Name', key: 'userName', width: 10 },
        { header: 'Product', key: 'productName', width: 25 },
        { header: 'Quantity', key: 'quantity', width: 5 },
        { header: 'Total Amount', key: 'totalAmount', width: 10 },
        { header: 'Order status', key: 'orderStatus', width: 10 },
        { header: 'Payment Method', key: 'paymentMethod', width: 10 },
        { header: 'Address', key: 'address', width: 55 },
      ];
  
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });
  
      orders.forEach((eachOrder) => {
        eachOrder.items.forEach((item) => {
          const fullAddress = `${eachOrder.address.street}, ${eachOrder.address.city}, ${eachOrder.address.state}, ${eachOrder.address.pinCode}`;
          const salesData = {
            Sno: serialNumber++,
            userId: eachOrder.user._id,
            orderDate: eachOrder.orderDate,
            userName: eachOrder.address.name,
            productName: item.product.name,
            quantity: item.quantity,
            totalAmount: eachOrder.totalAmount,
            orderStatus: eachOrder.status,
            paymentMethod: eachOrder.paymentMethod,
            address: fullAddress,
          };
          worksheet.addRow(salesData);
        });
      });
  
     
    const filePath = path.join(__dirname, "sales_report.xlsx");
    const exportPath = path.resolve(
      "Public",
      "sales_report",
      "sales-report.xlsx"
    );
  
  
      await workbook.xlsx.writeFile(exportPath);
      res.download(exportPath, 'sales_report.xlsx', (err) => {
        if (err) {
          res.status(500).send('Error sending the file');
        }
      });
    } catch (error) {
      console.error('Error generating Excel file:', error);
      res.status(500).send('Error generating the file');
    }
  };



  module.exports={
    getExcelSalesReport,
  }