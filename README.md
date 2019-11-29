# platformOS Payments

A module for processing payments in platformOS.

## List of features

- [x] create charge using a form
- [x] create charge using a mutation
- [x] create customer using a form
- [x] create customer using a mutation
- [x] configure module with template-values
- [x] create credit card using a form
- [x] create credit card using a mutation
- [x] create refund using a form
- [x] create refund using a mutation
- [x] add authorization policies where needed
- [x] add API call for capturing authorized charges
- [x] webhook support
- [x] create merchant account using a form
- [x] graph queries to fetch all defined modules
- [x] proper error handling
- [x] token charge
- [x] automated payouts to connected accounts
- [x] manual payouts
- [ ] gateway configuration UI

# Installation

The **platformOS Payments** module is designed to work with multiple payment providers. For now, the main supported Payment Gateway is [Stripe](https://stripe.com). Stripe integration comes with a separate module that needs to be installed. Follow the steps below to install the **platformOS Payments Stripe** module.

## Installation through the Partner Portal

1. Go to the [Module Marketplace](https://portal.apps.near-me.com/module_marketplace) and click on "Buy" (it's FREE) next to the "PlatformOS Payments" and "PlatformOS Payments Stripe" modules.
2. Go to your Instance view and install both modules.
3. During the installation process, set up Stripe public and secret keys.
4. Make sure that `enable_sms_and_api_workflow_alerts_on_staging` in your Instance configuration is set to `true`.

## Manual installation

1. Open a terminal and go to the root directory of your Instance codebase.
2. Install the platformOS Payment Module from our GitHub repository:

```
git submodule add https://github.com/mdyd-dev/platformos-payments modules/payments
```

3. Install the platformOS Stripe Module from our GitHub repository:

```
git submodule add https://github.com/mdyd-dev/platformos-payments-stripe modules/stripe
```

4. Edit `modules/stripe/template-values.json` and _set Stripe public and secret keys_
5. Deploy Instance.
6. Make sure that `enable_sms_and_api_workflow_alerts_on_staging` in your Instance configuration is set to `true`.

# Documentation

To learn more, check out the following topics in our documentation:

- [Integrating Stripe](https://documentation.platform-os.com/tutorials/payments/integrating-stripe)
- [Processing Payments with GraphQL Mutations](https://documentation.platform-os.com/tutorials/payments/processing-payments-graphql-mutations)

# Live examples

Find code examples for various payment actions is a separate code repository: [Payment Examples](https://github.com/mdyd-dev/platformos-payment-examples).
Each example is included as a different module for proper encapsulation. The demo version of the example can be found on the [Payment Examples Page](https://payment-examples.staging.oregon.platform-os.com)

- [Charge Example](https://github.com/mdyd-dev/platformos-payment-examples/blob/master/modules/charge_example/public/views): Demonstrates how to include most basic payment scenarios with the Stripe popup component and the ability to refund each payment. You can play with the example on the [payment demo page](https://payment-examples.staging.oregon.platform-os.com/payments).
- [Account Example](https://github.com/mdyd-dev/platformos-payment-examples/tree/master/modules/account_example/public/views): In this example, you will learn how to integrate Stripe Connect with custom accounts support as well as how to process payments to connected accounts. [Demo page](https://payment-examples.staging.oregon.platform-os.com/account)
- [Stripe Elements Example](https://github.com/mdyd-dev/platformos-payment-examples/tree/master/modules/elements_example): Stripe Elements provide you with Credit Card form functionality that can be quickly added to any page. In this example, you will see how to approach two-step payments with Authorize and Capture. [Demo](https://payment-examples.staging.oregon.platform-os.com/elements)
- [Customer Example](https://github.com/mdyd-dev/platformos-payment-examples/tree/master/modules/customer_example): Here you will learn the basics of saving your customers' Credit Cards to charge them in the future without reading Credit Card details. [Demo](https://payment-examples.staging.oregon.platform-os.com/customer)

# How the platformOS Payments module works

The platformOS Payments module is a backbone for processing payments with the third party API of any payment gateway that is installed as a separate module.
The entry point for any action is `gateway_request_form` that can be used as an embedded form or mutation as follows:

1. On any page include gateway_request_form with proper configuration:

- gateway: the name of the module that defines API communication with the payment gateway (for now, only the Stripe gateway is available as a separate module)
- request_type: the name of the request that is predefined in the API communication module, for example, "create_payment" or "create_refund"

2. User visits the page where the form is embedded.
3. Based on the value of "request_type", the form content defined in `modules/stripe/public/views/partials/templates/[request_type]` is rendered in the browser.
4. When the form submission request is processed with `gateway_request_form`, the code in `default_payload` is invoked:

- The gateway API call is invoked with the `gateway_request` mutation and the API notification template based on request_type
- The gateway response is processed with `response_mapper` defined in `modules/stripe/public/views/partials/response_mapper/[request_type]`
- The Customization is created/updated/deleted based on the parsed response and its type.

# Gateway request Form Configuration

When you include gateway_request_form on any page, you need to pass two objects as parameters `data` and `config`:

`{%- include_form 'modules/payments/gateway_request_form', config: config, data: data %}`

## Config object

The `config` object holds the set of configuration options.

There are several options common to all request types:

- gateway: the name of the gateway module e.g. "stripe". Please make sure that the proper module is installed.
- request_type: defines what kind of request you want to perform. All available requests are defined in `modules/[gateway]/public/notifications/api_call_notifications/[request_type].liquid`. See [Request Types Section](https://github.com/mdyd-dev/platformos-payments-stripe#manual-installation)] in Stripe Module Documentation.
- callback: path to the partial with the code that is processed after a successful request to the payment gateway.
- success_message: flash message text presented after successfull API request
- error_message: flash message text presented after unsuccessful API request
- success_path: point of redirection after successful API request, default is the current path
- error_path: point of redirection after unsuccessful API request, default is the current path

Additionally, you can pass configuration options specific to the request type — for more details please refer to the documentation of the gateway module for the chosen request type. You can find the list of available request types for Stripe on the [Stripe Module Readme Page](https://github.com/mdyd-dev/platformos-payments-stripe#request-types).

## Data object

The `data` object is used to pass all data to the payment gateway request. Object state is validated with a secret key so it can not be altered by the user before it is sent to the gateway. Each gateway request requires different data sets, please check the options for each request type in the [documentation](https://github.com/mdyd-dev/platformos-payments-stripe#request-types).

## Example 1: create_payment

The payment model represents money transfer from the payment source (typically Credit Card) to the payment receiver (usually Payment Gateway).
The payment should be immutable, it should be successful or failed and should not be changed. If one payment fails for some reason (insufficient funds) you should not update the failed payment but create a new one.

The easiest way to enable payment creation on your page is by embedding the form with proper configuration as in the example below.

```
{%- parse_json data -%}
  {
    "email": "{{ context.current_user.email }}",
    "currency": "USD",
    "description": "Charge Example",
    "statement_descriptor": "Example 1.",
    "amount": "500",
    "require_zip": true
  }
{%- endparse_json -%}

{%- parse_json config -%}
  {
    "gateway": "stripe",
    "request_type": "create_payment",
    "button": "Pay Now",
    "require_zip": "true",
    "success_path": "/payments"
  }
{%- endparse_json -%}

{%-
  include_form 'modules/payments/gateway_request_form',
  config: config,
  data: data
%}
```

See the [documentation](https://github.com/mdyd-dev/platformos-payments-stripe#create_payment) for more information about `data` and `config` objects.

## Example 2. Gateway request with mutation

In this example, you will learn how to invoke any gateway request as a callback with a GraphQL mutation.

1. Similar to Example 1, define `config` and `data` objects:

   ```
   {% parse_json "data" %}
     {
       "destination": "{{ destination }}",
       "amount": "{{ context.params.amount }}",
       "currency": "USD"
     }
   {% endparse_json %}

   {% parse_json "config" %}
     {
       "request_type": "create_transfer",
       "gateway": "stripe"
     }
   {% endparse_json %}
   ```

2. Prepare JSON that will wrap `data` and `config` as properties of the GatewayRequest object:
   ```
   {% parse_json "gateway_request_data" %}
     {
       "properties": [
          { "name": "config", "value": "{{ config | json | escape_javascript }}" },
          { "name": "data", "value":  "{{ data | json | escape_javascript }}" }
        ]
     }
   {% endparse_json %}
   ```
3. Pass `gateway_request_data` object to `create_customization` mutation:

   ```
   {%
     graphql g = "modules/payments/create_customization",
       form: "modules/payments/gateway_request_mutation_form",
       data: gateway_request_data
   %}

   ```

   Please note, that `gateway_request_mutation_form` is used instead of 'gateway_request_form' in order to skip authorization_policy checks that are necessary when passing data through an HTML form.

4. Process the mutation execution response.

# Customization of the platformOS Payments module

### Template customization

When the gateway_request_form is included on a page, a predefined template for gthe iven request_type is rendered. For the Stripe module, you will find all those templates [here](https://github.com/mdyd-dev/platformos-payments-stripe/tree/master/public/views/partials/templates). If you need to customize them, use the `gateway_template` configuration option to pass the partial view of your choice.

Example:

```
{%- parse_json 'config' -%}
  {
    "gateway_template": "modules/elements_example/create_payment_elements",
    "request_type": "create_payment",
    "success_path": "/elements"
  }
{%- endparse_json -%}

{%-
  include_form 'modules/payments/gateway_request_form',
  config: config,
  data: data
%}
```

### Custom Callbacks

If you need to add an additional action after the payment gateway response has been processed, use the `callback` config option to pass the path to the partial with the code that will be executed after a successful gateway request.

Example:

```
{%- parse_json 'config' -%}
  {
    "gateway": "stripe",
    "request_type": "capture_payment",
    "callback": "modules/ecommerce/payments/create_payment_callback"
  }
{%- endparse_json -%}

{%-
  include_form 'modules/payments/gateway_request_form',
  config: config,
  data: data
%}

```

In the view partial, you can invoke a GraphQL mutation to update the state of any object in the database.

```
{%- assign order_id = params.properties_attributes.order_id | plus: 0 -%}
{%- graphql callback_result = "modules/ecommerce/update_order", id: order_id, state: "paid" -%}
```

# GraphQL endpoints

## Retrieving stored customer by email address

To retrieve stored customer:

```
{%- graphql g_customer = 'modules/payments/get_customer_by_email',
  email: "some@example.com"
-%}
```

Params:
email: Customers' email

Returns Array<modules/payments/customer>:

- gateway_id
- email
- default_source: ID of a default card of this user

## Retrieving customer's stored cards

To retrieve references to stored cards in stripe you can use:

```
{%- graphql g_cards = 'modules/payments/get_credit_cards_by_customer_id',
  customer_id: customer_id
-%}
```

Or you can fetch credit cards with Stripe Customer ID (external_id):

```
{%- graphql g_cards = 'modules/payments/get_credit_cards_by_external_id',
  external_id: external_id
-%}
```

Params:
customer_id: ID of already stored customer

Returns Array<modules/payments/credit_card>:

- gateway_id
- gateway_customer_id
- customer_id
- brand
- exp_month
- exp_year
- last4

