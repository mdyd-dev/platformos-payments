class CheckoutPaymentForm {
  constructor() {
    this.initialize(); // get all the config options from html
    this.configure(); // configure widget
    console.log(typeof(this.addNewCardButton));
    if (this.addNewCardButton != null) {
      this.addNewCardButton.addEventListener("click", this.open.bind(this));
    } else { 
      this.open(); // show when everything is ready
    }
  }

  initialize() {
    this.addCardContainer = document.querySelector('[data-add-new-card]');
    this.addNewCardButton = document.querySelector('[data="add-new-card-button"]');
    this.form = this.addCardContainer.closest('form');

    /* Stripe configuration data */
    this.publishableKey = this.addCardContainer.dataset.publicKey;
    this.tokenField = document.querySelector('[data-cc-token]');

    /* Data for stripe to construct proper popup window */
    this.stripeEmail = this.addCardContainer.dataset.userEmail;
    this.stripeTitle = this.addCardContainer.dataset.checkoutTitle;
    this.stripeDescription = this.addCardContainer.dataset.checkoutDescription;
    this.stripeIcon = this.addCardContainer.dataset.checkoutIcon;
    this.stripeButtonLabel = this.addCardContainer.dataset.buttonLabel;
    this.stripeAmount = this.addCardContainer.dataset.amount;
  }

  configure() {
    this.handler = StripeCheckout.configure({
      key: this.publishableKey,
      image: this.stripeIcon,
      locale: 'auto',
      token: token => {
        if (token.error) {
          console.log(token.error);
          return;
        }

        // Insert the token ID into the form so it gets submitted to the server:
        this.tokenField.value = token.id;

        this.form.submit();
      }
    });
  }

  open() {
    this.handler.open({
      name: this.stripeTitle,
      amount: this.stripeAmount,
      description: this.stripeDescription,
      panelLabel: this.stripeButtonLabel,
      zipCode: false,
      email: this.stripeEmail
    });
  }
}

new CheckoutPaymentForm();

