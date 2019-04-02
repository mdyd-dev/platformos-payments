# PlatformOS Payments

A module for processing payments in PlatformOS.

## List of features
 -[x] create charge with form
 -[] create charge with mutation
 -[x] create custoer with form
 -[x] module configuration with template-values
 -[] create customer with mutation
 -[] create credit card with form
 -[] create credit card with mutation
 -[] create refund with form
 -[] create refund with mutation
 -[] add autorization policies where needed
 -[] add api call for capturing authorized charges
 -[] webhook support
 -[] merchant account creation with form
 -[] automated payouts
 -[] manual payouts
 -[] grapph queries to fetch all defined modules

## Installation

PlatformOS Payment module is designed to work with multipl Payment provides. For to moment the main supported Payment Gateway is [Stripe](https://stripe.com) and it comes with separated module that needs to be installed, simply follow the steps bellow for quick installation.

### Installation with Partner Portal
1. Go to [modules marketplace](https://portal.apps.near-me.com/module_marketplace) and click on "Buy" next to "PlatformOS Payments" and "PlatformOS Payments Stripe" modules.
2. Go to your Instance view and install both modules
3. In the installation process set up Stripe public and secret keys
4. Make sure enable_sms_and_api_workflow_alerts_on_staging in your instance configuration is set to true


### Manual installation

1. Open terminal and go to your instance code root directory
2. Install PlatfromOS Payment Module from GitHub repository
  ```
  git submodule add https://github.com/mdyd-dev/platformos-payments modules/payments
  ```
3. Install PlatfromOS Stripe Module from GitHub repository
```
git submodule add https://github.com/mdyd-dev/platformos-payments-stripe modules/stripe
```
4. Edit `modules/stripe/template-values.json` and set Stripe public and secret keys
5. Deploy instance.  
6. Make sure enable_sms_and_api_workflow_alerts_on_staging in your instance configuration is set to true

## Payment Model

Payment model represents money transfer from payment source (typically Credit Card) to payment receiver usually Payment Gateway.
Payment should be immutable, it should be successful or failed and should not be changed. If one payment fails for some reason (insufficient funds) you should not update the failed payment but create new one. 

The easiest way to enable payment creation on your page is by simply embeding the form with proper configuration as in the example below.

```
{%- parse_json 'data' -%}
  {
    "email": "{{ context.current_user.email }}",
    "currency": "USD",
    "description": "Charge Example",
    "statement_descriptor": "Example 1.",
    "amount": "500",
    "require_zip": true
  }
{%- endparse_json -%}

{%-
  include_form 'modules/payments/gateway_request_form',
  gateway: 'stripe'
  request_type: 'create_payment'
  redirect_to: '/payments'
  data: data
%}
```

Where:
- gateway - payent gateway used for transaction
- request_type - defines type of request that is send to payment gateway, value is determined by installed "gateway module".
- redirect_to - point of redirection
- configuration - 

Data object:
- currency - transaction currency
- description - transaction description visible in Stripe Checout form
- statement_descriptor - description of the transaction visible on the bank statement
- amount_cents - Charge amount in cents

Additinal Data object properties
- metadata - json object with key/value pair storing extra info about this charge in Stripe
- application_fee_cents - Application fee that should be deducted from the amount_cents and collected as a fee.
- email - email of the customer that is being charged


- modules/payments/customer
- modules/payments/credit_card
- modules/payments/charge

## Creating a customer

To create a customer in Stripe and store a Credit/Debit card, without charging user, you can use following mutation:

```
{%- execute_query 'modules/payments/create_customer', result_name: 'g_customer',
  email: 'some@example.com', #customer email
  source: 'tok_XXXX', #a token representing a card returned by Stripe from Checkout JS form
  description: 'optional description'
-%}
```

## Retrieving stored customer by email address

To retrieve stored customer:

```
{%- query_graph 'modules/payments/get_customer_by_email', result_name: 'g_customer',
  email: "some@example.com"
-%}
```
Params:
  email - Customers' email

Returns Array<modules/payments/customer>:
- gateway_id
- email
- default_source - ID of a default card of this user

## Retrieving customer's stored cards

To retrieve references to stored cards in stripe you can use:

```
{%- query_graph 'modules/payments/get_credit_cards_by_customer_id', result_name: 'g_cards',
  customer_id: customer_id
-%}
```

Or you can fetch credit cards with Stripe Customer ID (external_customer_id)

```
{%- query_graph 'modules/payments/get_credit_cards_by_external_customer_id', result_name: 'g_cards',
  external_customer_id: external_customer_id
-%}
```
Params:
  customer_id - ID of already stored customer

Returns Array<modules/payments/credit_card>:
- gateway_id
- gateway_customer_id
- customer_id
- brand
- exp_month
- exp_year
- last4

