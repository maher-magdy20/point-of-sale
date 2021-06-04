  // close sale  and save/send data

  class Order {
      constructor() {
          this._menu = [];
          this._previousSales = [];
          this._invoiceNumber = "";
          this._order = [];
          this._payment = {
              amountPaid: 0,
              type: "",
              changeTip: 0
          };
      }

      get menu() {
          return this._menu;
      }

      set menu(menuArray) {
          this._menu = [];

          menuArray.forEach(menuItem => {
              let currItem = {};
              currItem.sku = menuItem[0];
              currItem.description = menuItem[1];
              currItem.price = menuItem[2];
              currItem.taxRate = menuItem[3];
              currItem.image = menuItem[4];
              this._menu.push(currItem);
          })
      }

      get previousSales() {
          return this._previousSales;
      }

      set previousSales(salesData) {
          this._previousSales = salesData;
      }

      get invoiceNumber() {
          return this._invoiceNumber;
      }

      set invoiceNumber(num) {
          this._invoiceNumber = num.toString();
      }

      get order() {
          return this._order;
      }

      set order(data) {
          this._order = data;
      }

      get payment() {
          return this._payment;
      }

      set payment(payment) {
          this._payment = payment;
      }

      generateInvoiceNumber() {
          if (this.previousSales.length < 1 || this.previousSales == undefined) {
              this.invoiceNumber = 1;
          } else {
              let skuArray = this.previousSales.map(sku => sku[1]);
              let highest = skuArray.reduce(function(a, b) {
                  return Math.max(a, b);
              });
              this.invoiceNumber = highest + 1;
          }
      }

      addOrderLine(quantity, data) {
          let currentLine = {};
          let lineData = JSON.parse(data)

          currentLine.sku = lineData.sku;
          currentLine.description = lineData.description;
          currentLine.quantity = quantity;
          currentLine.price = Utilities.roundToTwo(parseFloat(lineData.price));
          currentLine.subtotal = currentLine.quantity * currentLine.price;
          currentLine.tax = Utilities.roundToTwo(lineData.taxRate * currentLine.subtotal);

          this.order.push(currentLine);
          Ui.receiptDetails(this);
      }

      deleteOrderLine(index) {
          this.order.splice(index, 1);
          Ui.receiptDetails(this)
      }

      clearOrder() {
          this.order = [];

          Ui.receiptDetails(this);
      }
      getSummary() {
          const summary = {
              subtotal: 0,
              tax: 0,
              grandtotal: 0
          }

          this.order.forEach(orderLine => {
              summary.subtotal += orderLine.subtotal;
              summary.tax += orderLine.tax;
          })

          summary.grandtotal = summary.subtotal - summary.tax;

          return summary;
      }

      changePayment(input) {
          const orderGrandTotal = this.getSummary().grandtotal;
          if (input.amountPaid != null) this.payment.amountPaid = parseFloat(input.amountPaid);
          if (input.type != null) this.payment.type = input.type;
          if (this.payment.amountPaid >= orderGrandTotal) {
              this.payment.changeTip = this.payment.amountPaid - orderGrandTotal;
              Ui.closeButton(false);
          } else {
              this.payment.changeTip = 0;
              Ui.closeButton(true)
          }

          Ui.paymentSummary(this);
      }

      clearPayment() {
          this.payment = {
              amountPaid: 0,
              type: "",
              changeTip: 0
          };

          Ui.paymentSummary(this);
      }

      exportOrder(date) {
          let exportData = [];

          this.order.forEach(orderLine => {
              let currentLine = [];
              currentLine[0] = date;
              currentLine[1] = this.invoiceNumber;
              currentLine[2] = orderLine.sku;
              currentLine[3] = orderLine.quantity;
              currentLine[4] = orderLine.price;
              currentLine[5] = orderLine.tax;

              exportData.push(currentLine);
              this.previousSales.push(currentLine);
          })

          return exportData;
      }

      exportPayment(date) {
          const currentPayment = [
              []
          ];
          const tipChange = Utilities.roundToTwo(this.payment.amountPaid - this.getSummary().grandtotal);

          currentPayment[0][0] = date;
          currentPayment[0][1] = this.invoiceNumber;
          currentPayment[0][2] = this.getSummary().grandtotal;
          currentPayment[0][3] = this.payment.type;

          if (this.payment.type == "cash") {
              currentPayment[0][4] = 0;
          } else {
              currentPayment[0][4] = tipChange;
          }
          return currentPayment;
      }

      closeSale() {
          const date = new Date();
          const orderData = this.exportOrder(date);
          const paymentData = this.exportPayment(date);
          const exportData = {
              order: orderData,
              payment: paymentData
          }

          Ui.hidePaypad(this);
          this.clearPayment();
          this.clearOrder();
          Ui.invoiceNumber(this);

          google.script.run.setData(JSON.stringify(exportData));
      }
  }

  class Ui {

      static menu(orderInstance) {
          let frag = document.createDocumentFragment();

          orderInstance.menu.forEach(item => {
              let menuElement = `<img src="${item.image}'" alt="${item.description}" class="menu-img" style="width:150px;">
            <figcaption>${item.description}</figcaption>
            <figcaption>${Utilities.convertFloatToString(item.price)}</figcaption>`

              let node = document.createElement("figure");
              node.className = "menu-item";
              let dataString = JSON.stringify({ sku: `${item.sku}`, description: `${item.description}`, price: `${item.price}`, taxRate: `${item.taxRate}` })
              node.setAttribute("data-sku", dataString);
              node.innerHTML = menuElement;
              frag.appendChild(node);
          });

          document.getElementById('menu').appendChild(frag);

          document.querySelectorAll(".menu-item").forEach(button => {
              button.addEventListener('click', () => {
                  orderInstance.addOrderLine(1, button.getAttribute("data-sku"));
              })
          })
      }

      static receiptDetails(orderInstance) {
          let frag = document.createDocumentFragment();

          orderInstance.order.forEach((orderLine, index) => {
              let receiptLine = `<td class="description">${orderLine.description}</td>
            <td class="quantity">${orderLine.quantity}</td>
            <td class="price">${Utilities.convertFloatToString(orderLine.price)}</td>
            <td class="subtotal">${Utilities.convertFloatToString(orderLine.subtotal)}</td>
            <td class="delete" data-delete="${index.toString()}"><i class="fas fa-backspace"></i></td>`

              let node = document.createElement("tr");
              node.setAttribute("data-index", `${index.toString()}`);
              node.innerHTML = receiptLine;
              frag.appendChild(node);
          });

          let receiptDetails = document.getElementById("receipt-details");
          while (receiptDetails.hasChildNodes()) {
              receiptDetails.removeChild(receiptDetails.childNodes[0]);
          }

          receiptDetails.appendChild(frag);
          this.summary(orderInstance);

          document.querySelectorAll('.delete').forEach(button => {
              button.addEventListener('click', () => {
                  orderInstance.deleteOrderLine(parseInt(button.getAttribute("data-delete")));
              })
          })
      }

      static invoiceNumber(orderInstance) {
          orderInstance.generateInvoiceNumber();
          const invoiceNumber = orderInstance.invoiceNumber;
          document.getElementById('invoice-number').textContent = `Invoice# ${invoiceNumber}`
      }
      static summary(orderInstance) {
          const summary = orderInstance.getSummary();
          const subtotal = document.getElementById("subtotal-summary");
          const tax = document.getElementById("tax-summary");
          const grandtotal = document.getElementById("grandtotal-summary");

          subtotal.textContent = Utilities.convertFloatToString(summary.subtotal);
          tax.textContent = Utilities.convertFloatToString(summary.tax);
          grandtotal.textContent = Utilities.convertFloatToString(summary.grandtotal);
      }

      static showPaypad(orderInstance) {
          const paypad = document.getElementById('payment-overlay');
          paypad.style.display = "grid"
      }

      static hidePaypad(orderInstance) {
          const paypad = document.getElementById('payment-overlay');
          paypad.style.display = "none"
      }


      static paymentSummary(orderInstance) {
          document.getElementById('amount-paid').textContent = Utilities.convertFloatToString(orderInstance.payment.amountPaid);

          const changeTipTitle = document.getElementById('tip-change-title');
          const paymentType = document.getElementById('payment-type');

          if (orderInstance.payment.type === 'credit') {
              changeTipTitle.textContent = "Tip:";
              paymentType.textContent = "CC";
          } else if (orderInstance.payment.type === 'cash') {
              changeTipTitle.textContent = "Change:";
              paymentType.textContent = "Cash";
          } else {
              changeTipTitle.textContent = "Change:";
              paymentType.textContent = "";
          }

          document.getElementById("tip-change-value").textContent = Utilities.convertFloatToString(orderInstance.payment.changeTip);
      }


      static closeButton(bool) {
          const closeButton = document.getElementById('close-sale');
          if (bool) {
              closeButton.style.display = "none";
          } else {
              closeButton.style.display = "grid";
          }
      }
  }

  class Utilities {

      static convertFloatToString(float) {
          let priceParams = {
              style: "currency",
              currency: "EGP"
          };

          return float.toLocaleString("en-us", priceParams);
      }

      static roundToTwo(num) {
          return +(Math.round(num + "e+2") + "e-2");
      }

      static paypad(input, orderInstance) {
          if (!isNaN(parseInt(input))) {
              this.numberPaypad(parseInt(input), orderInstance);
          } else if (input === "back") {
              this.backPaypad(orderInstance);
          } else if (input === "clear") {
              this.clearPaypad(orderInstance);
          } else {
              orderInstance.closeSale();
          }
      }

      static numberPaypad(input, orderInstance) {
          const currentInput = this.roundToTwo(input * .01);
          const currentAmountPaid = this.roundToTwo(orderInstance.payment.amountPaid);
          const newAmountPaid = this.roundToTwo((currentAmountPaid * 10) + currentInput);

          if (currentAmountPaid === 0) {
              orderInstance.changePayment({ amountPaid: currentInput });
          } else {
              orderInstance.changePayment({ amountPaid: newAmountPaid });
          }
      }

      static backPaypad(orderInstance) {
          const currentPayment = orderInstance.payment.amountPaid;

          if (currentPayment > 0) {
              const toSubtract = ((currentPayment * 100) % 10) * 0.01;
              const newAmount = (currentPayment - toSubtract) * 0.1;
              orderInstance.changePayment({ amountPaid: newAmount });
          }
      }

      static clearPaypad(orderInstance) {
          orderInstance.changePayment({ amountPaid: 0 });
      }
  }






  //-----------------------------------------------ORDER INSTANTIATION

  //   function sheetData() {
  //       google.script.run.withSuccessHandler(function(dataArray) {

  //           items = Object.values(dataArray.items);
  //           sales = dataArray.sales;

  //           order.menu = items;
  //           order.previousSales = sales;

  //           Ui.menu(order);
  //           Ui.invoiceNumber(order);
  //       }).getData();
  //   }

  //   sheetData();





  //----------------------------------------------STATIC EVENT LISTENERS

  document.getElementById('clear-order').addEventListener('click', () => {
      order.clearOrder();
  })

  document.querySelectorAll('.paypad-show').forEach(button => {
      button.addEventListener('click', () => {
          Ui.showPaypad(order);
          order.changePayment(JSON.parse(button.getAttribute("data-payment-type")));
      })
  })

  document.getElementById('paypad-close').addEventListener('click', () => {
      order.clearPayment();
      Ui.hidePaypad(order);
  })

  document.querySelectorAll('.paypad-btn').forEach(button => {
      button.addEventListener('click', () => {
          Utilities.paypad(button.getAttribute("data-id"), order);
      })
  })



  const mockMenuData = [
      [101, 'Hard Disk Drive 1TB', 750, 0.05, 'https://i.ibb.co/mRbLLYB/1.jpg'],
      [102, 'Hard ssd 128GB', 343, 0.05, 'https://i.ibb.co/Rb0jTsL/1-1.jpg'],
      [103, 'Toshiba Battery', 333, 0.05, 'https://i.ibb.co/FzqYwQT/1-2.jpg'],
      [104, 'USB sound card adapter', 234, 0.05, 'https://i.ibb.co/3YSgc2Q/1-3.jpg'],
      [105, 'Laptop Memory 8GB', 690, 0.05, 'https://i.ibb.co/wywBH0P/1-4.jpg'],
      [106, 'Electron cooler', 105, 0.05, 'https://i.ibb.co/sWMQ5YD/1-5.jpg'],
      [107, 'A fan for the computer', 125, 0.05, 'https://i.ibb.co/tqTWzyP/1-6.jpg'],
      [108, 'External DVD Drive', 438, 0.05, 'https://i.ibb.co/D8yTJFR/1-7.jpg'],
      [109, 'Flash Memory 16GB', 70, 0.05, 'https://i.ibb.co/fGnKrD1/1-8.jpg'],
      [110, 'Mouse - Black', 25, 0.05, 'https://i.ibb.co/QNqGZyz/1-9.jpg'],
      [111, 'Flash Memory 64GB', 120, 0.05, 'https://i.ibb.co/Y7xkR98/1-10.jpg'],
      [112, 'memory card Toshiba 32GB', 80, 0.05, 'https://i.ibb.co/mBSkkCV/1-11.jpg'],
      [113, 'OTG USB Flash Drive 32GB', 425, 0.05, 'https://i.ibb.co/P5yz223/1-12.jpg'],
      [114, 'keyboard', 110, 0.05, 'https://i.ibb.co/WyhBnb3/1-13.jpg'],
      [115, 'The Gemming Group', 300, 0.05, 'https://i.ibb.co/Zh26fM5/1-14.jpg'],
  ];

  const mockPreviousSalesData = [
      ["", 4999, 101.0, 1.0, 10.99, 0.5495],
      ["", 4999, 102.0, 2.0, 7.95, 0.3975],
      ["", 4999, 103.0, 3.0, 8.96, 0.45],
      ["", 5000, 106.0, 1.0, 6.99, 0.35],
      ["", 5000, 107.0, 1.0, 5.95, 0.30]
  ];

  const mockPaymentsData = [
      ["", 4999, 56.46, "cc", 5.00],
      ["", 5000, 13.59, "cash", 0]
  ]
  const order = new Order();
  order.menu = mockMenuData;
  order.previousSales = mockPreviousSalesData;
  Ui.menu(order);