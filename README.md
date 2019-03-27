# Stripe Payments module

A module for processing payments with Stripe

## Setup

To start using module please set up your credentials in a file: `public/views/partials/shared/api_credentials.liquid`

## Creating a charge

A charge will result in charging money from a given card, and creating a customer and a given card for future use.

```
{%- execute_query 'modules/payments/create_charge', result_name: 'g',
  credit_card_id: "123"
  credit_card_token: "tok_XXXX"
  currency: "USD"
  description: "transaction description"
  statement_descriptor: "statement description"
  capture: "true"
  customer_id: "123"
  metadata: metadata
  amount_cents: "1000"
  application_fee_cents: "100"
  customer_email: "some@example.com"
-%}
```
Where:
- credit_card_id - if you want to use already stored card, pass it's id here
- credit_card_token - for new cards pass a token representing a card returned by Stripe from Checkout JS form
- currency - transaction currency
- description - transaction description visible in Stripe Checout form
- statement_descriptor - description of the transaction visible on the bank statement
- capture - true/false value. Whether to immediately capture the charge. Defaults to true. When false, the charge issues an authorization, and will need to be captured later. Uncaptured charges expire in seven days
- customer_id - id of the customer already stored in the app.
- metadata - json object with key/value pair storing extra info about this charge in Stripe
- amount_cents - Charge amount in cents
- application_fee_cents - Application fee that should be deducted from the amount_cents and collected as a fee.
- customer_email - email of the customer that is being charged

This mutation will create 3 models:
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

## Things that needs to be implemented:
- implement a way to configure module with API credentials
- add autorization policies where needed
- add api call for capturing authorized charges
- refunds support
- webhook endpoint to track payouts
