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
      [101, 'Arduino UNO', 150, 0.05, 'https://i.ibb.co/gFV0bkQ/Arduino-Uno-R3.jpg'],
      [102, 'CNC Arduino Shield', 190, 0.05, 'https://i.ibb.co/FKhKRsS/item-XL-22448836-30567955.jpg'],
      [103, 'Board', 41, 0.05, 'https://i.ibb.co/Btwwwqp/item-L-11418473-16056016.jpg'],
      [104, 'Wireless-Bluetooth', 24.75, 0.05, 'https://i.ibb.co/vZPt14H/1-Pcs-HC-05-Serial-Transceiver-Wireless-Bluetooth-Module-A-Master-slave-Machine-Communication-Power.jpg'],
      [105, 'servo motor', 65, 0.05, 'https://i.ibb.co/DMvbKDh/790aaa266116874cc356e870c6408a617386d401.jpg'],
      [106, 'Cable ', 32, 0.05, 'https://i.ibb.co/Vjgyn5q/item-XL-7662216-6471727.jpg'],
      [107, 'LCD', 51, 0.05, 'https://i.ibb.co/BLjRhDd/item-XL-9149424-9722060.jpg'],
      [108, 'Arduino Starter Kit', 1250, 0.05, 'https://i.ibb.co/g3NSb2c/item-XL-23883784-34790529.jpg'],
      [109, 'the car body', 252, 0.05, 'https://i.ibb.co/8mnJ8kd/item-XL-10745855-14367601.jpg'],
      [110, 'Heart rate meter', 219, 0.05, 'https://i.ibb.co/QKdV5fF/item-XL-9191505-9816650.jpg'],
      [111, 'water pump', 115, 0.05, 'https://i.ibb.co/8z44Krr/item-XL-30010046-a54b399419b79.jpg'],
      [112, 'Stepper motor', 93, 0.05, 'https://i.ibb.co/2ZWwFvW/item-XL-8425216-1d4f41cce56d0.jpg'],
      [113, 'fingers sensor module', 340, 0.05, 'https://i.ibb.co/Vmhzd0H/item-XL-30434816-100786258.jpg'],
      [114, 'Stepper Motor Driver Module', 77, 0.05, 'https://i.ibb.co/SwtRsNc/item-XL-122845781-397f712f461e7.jpg'],
      [115, 'motor', 67, 0.05, 'https://i.ibb.co/RgpwND3/item-XL-36069756-142165091.jpg'],
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