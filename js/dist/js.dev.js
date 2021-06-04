"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// close sale  and save/send data
var Order =
/*#__PURE__*/
function () {
  function Order() {
    _classCallCheck(this, Order);

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

  _createClass(Order, [{
    key: "generateInvoiceNumber",
    value: function generateInvoiceNumber() {
      if (this.previousSales.length < 1 || this.previousSales == undefined) {
        this.invoiceNumber = 1;
      } else {
        var skuArray = this.previousSales.map(function (sku) {
          return sku[1];
        });
        var highest = skuArray.reduce(function (a, b) {
          return Math.max(a, b);
        });
        this.invoiceNumber = highest + 1;
      }
    }
  }, {
    key: "addOrderLine",
    value: function addOrderLine(quantity, data) {
      var currentLine = {};
      var lineData = JSON.parse(data);
      currentLine.sku = lineData.sku;
      currentLine.description = lineData.description;
      currentLine.quantity = quantity;
      currentLine.price = Utilities.roundToTwo(parseFloat(lineData.price));
      currentLine.subtotal = currentLine.quantity * currentLine.price;
      currentLine.tax = Utilities.roundToTwo(lineData.taxRate * currentLine.subtotal);
      this.order.push(currentLine);
      Ui.receiptDetails(this);
    }
  }, {
    key: "deleteOrderLine",
    value: function deleteOrderLine(index) {
      this.order.splice(index, 1);
      Ui.receiptDetails(this);
    }
  }, {
    key: "clearOrder",
    value: function clearOrder() {
      this.order = [];
      Ui.receiptDetails(this);
    }
  }, {
    key: "getSummary",
    value: function getSummary() {
      var summary = {
        subtotal: 0,
        tax: 0,
        grandtotal: 0
      };
      this.order.forEach(function (orderLine) {
        summary.subtotal += orderLine.subtotal;
        summary.tax += orderLine.tax;
      });
      summary.grandtotal = summary.subtotal + summary.tax;
      return summary;
    }
  }, {
    key: "changePayment",
    value: function changePayment(input) {
      var orderGrandTotal = this.getSummary().grandtotal;
      if (input.amountPaid != null) this.payment.amountPaid = parseFloat(input.amountPaid);
      if (input.type != null) this.payment.type = input.type;

      if (this.payment.amountPaid >= orderGrandTotal) {
        this.payment.changeTip = this.payment.amountPaid - orderGrandTotal;
        Ui.closeButton(false);
      } else {
        this.payment.changeTip = 0;
        Ui.closeButton(true);
      }

      Ui.paymentSummary(this);
    }
  }, {
    key: "clearPayment",
    value: function clearPayment() {
      this.payment = {
        amountPaid: 0,
        type: "",
        changeTip: 0
      };
      Ui.paymentSummary(this);
    }
  }, {
    key: "exportOrder",
    value: function exportOrder(date) {
      var _this = this;

      var exportData = [];
      this.order.forEach(function (orderLine) {
        var currentLine = [];
        currentLine[0] = date;
        currentLine[1] = _this.invoiceNumber;
        currentLine[2] = orderLine.sku;
        currentLine[3] = orderLine.quantity;
        currentLine[4] = orderLine.price;
        currentLine[5] = orderLine.tax;
        exportData.push(currentLine);

        _this.previousSales.push(currentLine);
      });
      return exportData;
    }
  }, {
    key: "exportPayment",
    value: function exportPayment(date) {
      var currentPayment = [[]];
      var tipChange = Utilities.roundToTwo(this.payment.amountPaid - this.getSummary().grandtotal);
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
  }, {
    key: "closeSale",
    value: function closeSale() {
      var date = new Date();
      var orderData = this.exportOrder(date);
      var paymentData = this.exportPayment(date);
      var exportData = {
        order: orderData,
        payment: paymentData
      };
      Ui.hidePaypad(this);
      this.clearPayment();
      this.clearOrder();
      Ui.invoiceNumber(this);
      google.script.run.setData(JSON.stringify(exportData));
    }
  }, {
    key: "menu",
    get: function get() {
      return this._menu;
    },
    set: function set(menuArray) {
      var _this2 = this;

      this._menu = [];
      menuArray.forEach(function (menuItem) {
        var currItem = {};
        currItem.sku = menuItem[0];
        currItem.description = menuItem[1];
        currItem.price = menuItem[2];
        currItem.taxRate = menuItem[3];
        currItem.image = menuItem[4];

        _this2._menu.push(currItem);
      });
    }
  }, {
    key: "previousSales",
    get: function get() {
      return this._previousSales;
    },
    set: function set(salesData) {
      this._previousSales = salesData;
    }
  }, {
    key: "invoiceNumber",
    get: function get() {
      return this._invoiceNumber;
    },
    set: function set(num) {
      this._invoiceNumber = num.toString();
    }
  }, {
    key: "order",
    get: function get() {
      return this._order;
    },
    set: function set(data) {
      this._order = data;
    }
  }, {
    key: "payment",
    get: function get() {
      return this._payment;
    },
    set: function set(payment) {
      this._payment = payment;
    }
  }]);

  return Order;
}();

var Ui =
/*#__PURE__*/
function () {
  function Ui() {
    _classCallCheck(this, Ui);
  }

  _createClass(Ui, null, [{
    key: "menu",
    value: function menu(orderInstance) {
      var frag = document.createDocumentFragment();
      orderInstance.menu.forEach(function (item) {
        var menuElement = "<img src=\"".concat(item.image, "'\" alt=\"").concat(item.description, "\" class=\"menu-img\" style=\"width:150px;\">\n            <figcaption>").concat(item.description, "</figcaption>\n            <figcaption>").concat(Utilities.convertFloatToString(item.price), "</figcaption>");
        var node = document.createElement("figure");
        node.className = "menu-item";
        var dataString = JSON.stringify({
          sku: "".concat(item.sku),
          description: "".concat(item.description),
          price: "".concat(item.price),
          taxRate: "".concat(item.taxRate)
        });
        node.setAttribute("data-sku", dataString);
        node.innerHTML = menuElement;
        frag.appendChild(node);
      });
      document.getElementById('menu').appendChild(frag);
      document.querySelectorAll(".menu-item").forEach(function (button) {
        button.addEventListener('click', function () {
          orderInstance.addOrderLine(1, button.getAttribute("data-sku"));
        });
      });
    }
  }, {
    key: "receiptDetails",
    value: function receiptDetails(orderInstance) {
      var frag = document.createDocumentFragment();
      orderInstance.order.forEach(function (orderLine, index) {
        var receiptLine = "<td class=\"description\">".concat(orderLine.description, "</td>\n            <td class=\"quantity\">").concat(orderLine.quantity, "</td>\n            <td class=\"price\">").concat(Utilities.convertFloatToString(orderLine.price), "</td>\n            <td class=\"subtotal\">").concat(Utilities.convertFloatToString(orderLine.subtotal), "</td>\n            <td class=\"delete\" data-delete=\"").concat(index.toString(), "\"><i class=\"fas fa-backspace\"></i></td>");
        var node = document.createElement("tr");
        node.setAttribute("data-index", "".concat(index.toString()));
        node.innerHTML = receiptLine;
        frag.appendChild(node);
      });
      var receiptDetails = document.getElementById("receipt-details");

      while (receiptDetails.hasChildNodes()) {
        receiptDetails.removeChild(receiptDetails.childNodes[0]);
      }

      receiptDetails.appendChild(frag);
      this.summary(orderInstance);
      document.querySelectorAll('.delete').forEach(function (button) {
        button.addEventListener('click', function () {
          orderInstance.deleteOrderLine(parseInt(button.getAttribute("data-delete")));
        });
      });
    }
  }, {
    key: "invoiceNumber",
    value: function invoiceNumber(orderInstance) {
      orderInstance.generateInvoiceNumber();
      var invoiceNumber = orderInstance.invoiceNumber;
      document.getElementById('invoice-number').textContent = "Invoice# ".concat(invoiceNumber);
    }
  }, {
    key: "summary",
    value: function summary(orderInstance) {
      var summary = orderInstance.getSummary();
      var subtotal = document.getElementById("subtotal-summary");
      var tax = document.getElementById("tax-summary");
      var grandtotal = document.getElementById("grandtotal-summary");
      subtotal.textContent = Utilities.convertFloatToString(summary.subtotal);
      tax.textContent = Utilities.convertFloatToString(summary.tax);
      grandtotal.textContent = Utilities.convertFloatToString(summary.grandtotal);
    }
  }, {
    key: "showPaypad",
    value: function showPaypad(orderInstance) {
      var paypad = document.getElementById('payment-overlay');
      paypad.style.display = "grid";
    }
  }, {
    key: "hidePaypad",
    value: function hidePaypad(orderInstance) {
      var paypad = document.getElementById('payment-overlay');
      paypad.style.display = "none";
    }
  }, {
    key: "paymentSummary",
    value: function paymentSummary(orderInstance) {
      document.getElementById('amount-paid').textContent = Utilities.convertFloatToString(orderInstance.payment.amountPaid);
      var changeTipTitle = document.getElementById('tip-change-title');
      var paymentType = document.getElementById('payment-type');

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
  }, {
    key: "closeButton",
    value: function closeButton(bool) {
      var closeButton = document.getElementById('close-sale');

      if (bool) {
        closeButton.style.display = "none";
      } else {
        closeButton.style.display = "grid";
      }
    }
  }]);

  return Ui;
}();

var Utilities =
/*#__PURE__*/
function () {
  function Utilities() {
    _classCallCheck(this, Utilities);
  }

  _createClass(Utilities, null, [{
    key: "convertFloatToString",
    value: function convertFloatToString(_float) {
      var priceParams = {
        style: "currency",
        currency: "EGP"
      };
      return _float.toLocaleString("en-us", priceParams);
    }
  }, {
    key: "roundToTwo",
    value: function roundToTwo(num) {
      return +(Math.round(num + "e+2") + "e-2");
    }
  }, {
    key: "paypad",
    value: function paypad(input, orderInstance) {
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
  }, {
    key: "numberPaypad",
    value: function numberPaypad(input, orderInstance) {
      var currentInput = this.roundToTwo(input * .01);
      var currentAmountPaid = this.roundToTwo(orderInstance.payment.amountPaid);
      var newAmountPaid = this.roundToTwo(currentAmountPaid * 10 + currentInput);

      if (currentAmountPaid === 0) {
        orderInstance.changePayment({
          amountPaid: currentInput
        });
      } else {
        orderInstance.changePayment({
          amountPaid: newAmountPaid
        });
      }
    }
  }, {
    key: "backPaypad",
    value: function backPaypad(orderInstance) {
      var currentPayment = orderInstance.payment.amountPaid;

      if (currentPayment > 0) {
        var toSubtract = currentPayment * 100 % 10 * 0.01;
        var newAmount = (currentPayment - toSubtract) * 0.1;
        orderInstance.changePayment({
          amountPaid: newAmount
        });
      }
    }
  }, {
    key: "clearPaypad",
    value: function clearPaypad(orderInstance) {
      orderInstance.changePayment({
        amountPaid: 0
      });
    }
  }]);

  return Utilities;
}(); //-----------------------------------------------ORDER INSTANTIATION
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


document.getElementById('clear-order').addEventListener('click', function () {
  order.clearOrder();
});
document.querySelectorAll('.paypad-show').forEach(function (button) {
  button.addEventListener('click', function () {
    Ui.showPaypad(order);
    order.changePayment(JSON.parse(button.getAttribute("data-payment-type")));
  });
});
document.getElementById('paypad-close').addEventListener('click', function () {
  order.clearPayment();
  Ui.hidePaypad(order);
});
document.querySelectorAll('.paypad-btn').forEach(function (button) {
  button.addEventListener('click', function () {
    Utilities.paypad(button.getAttribute("data-id"), order);
  });
});
var mockMenuData = [[101, 'Respiratory crisis apparatus', 1790, 0.05, 'https://i.ibb.co/8Y1RdSB/item-XL-115644440-c4a59ab70103a.jpg'], [102, 'Pulse oximeter', 420, 0.05, 'https://i.ibb.co/vsKNttf/item-XL-22647870-31321654.jpg'], [103, 'blood pressure monitor', 999, 0.05, 'https://i.ibb.co/YtvCN31/file-30-1.jpg'], [104, '30°Sheath two-stopcock', 3360, 0.05, 'https://i.ibb.co/zHGzfGZ/77052.jpg'], [105, 'Steam inhalation device', 469, 0.05, 'https://i.ibb.co/YPsZkj3/nebulizator.jpg'], [106, 'Asch Septum Fcps 23cm, S/S', 1290, 0.05, 'https://i.ibb.co/mNJ7tmP/586-1.png'], [107, 'Brunings Septum forceps 16.5 cm', 51, 0.05, 'https://i.ibb.co/rGF5CHv/62284.png'], [108, 'amalgamator', 1225, 0.05, 'https://i.ibb.co/XD8WXFz/bc0609b2-a743-42e0-8fe6-a1d33f7a1cd9.jpg'], [109, 'Examination bed', 750, 0.05, 'https://i.ibb.co/tDPWzz4/13cdae11-60b9-412b-96f9-b7260001bc54.jpg'], [110, 'Stretcher ', 850, 0.05, 'https://i.ibb.co/Bff3TgQ/54282.jpg'], [111, 'Electrocardiograph', 23650, 0.05, 'https://i.ibb.co/qd0BWCV/52423.jpg'], [112, 'EKG machine', 6490, 0.05, 'https://i.ibb.co/jbJCcZd/48085.jpg'], [113, 'A trolley ambulance transforms into a chair', 1850, 0.05, 'https://i.ibb.co/BZ2NYXR/automatic-loading-stretcher-nf-a6-2-2.jpg'], [114, 'Bedside cabinet', 1260, 0.05, 'https://i.ibb.co/TMF48bt/48777.jpg'], [115, 'Childbirth Gynecology Table', 21000, 0.05, 'https://i.ibb.co/VLd0hbk/81082.jpg']];
var mockPreviousSalesData = [["", 4999, 101.0, 1.0, 10.99, 0.5495], ["", 4999, 102.0, 2.0, 7.95, 0.3975], ["", 4999, 103.0, 3.0, 8.96, 0.45], ["", 5000, 106.0, 1.0, 6.99, 0.35], ["", 5000, 107.0, 1.0, 5.95, 0.30]];
var mockPaymentsData = [["", 4999, 56.46, "cc", 5.00], ["", 5000, 13.59, "cash", 0]];
var order = new Order();
order.menu = mockMenuData;
order.previousSales = mockPreviousSalesData;
Ui.menu(order);
//# sourceMappingURL=js.dev.js.map
