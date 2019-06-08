# PlatformOS Payments

A module for processing payments in PlatformOS.

## List of features
 - [x] create charge with form
 - [x] create charge with mutation
 - [x] create customer with form
 - [x] module configuration with template-values
 - [x] create customer with mutation
 - [x] create credit card with form
 - [x] create credit card with mutation
 - [x] create refund with form
 - [x] create refund with mutation
 - [x] add autorization policies where needed
 - [x] add api call for capturing authorized charges
 - [x] webhook support
 - [x] merchant account creation with form
 - [x] grapph queries to fetch all defined modules
 - [x] proper error handling
 - [x] token charge
 - [x] automated payouts to connected accounts
 - [ ] manual payouts
 - [ ] gateway configuration UI

# Installation

PlatformOS Payment module is designed to work with multipl Payment provides. For to moment the main supported Payment Gateway is [Stripe](https://stripe.com) and it comes with separated module that needs to be installed, simply follow the steps bellow for quick installation.

### Installation with Partner Portal
1. Go to [modules marketplace](https://portal.apps.near-me.com/module_marketplace) and click on "Buy" (It's FREE) next to "PlatformOS Payments" and "PlatformOS Payments Stripe" modules.
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
4. Edit `modules/stripe/template-values.json` and *set Stripe public and secret keys*
5. Deploy instance.
6. Make sure enable_sms_and_api_workflow_alerts_on_staging in your instance configuration is set to true

# Live Examples

You will find code examples for various payment actions is separate code repository [Payment Examples](https://github.com/mdyd-dev/platformos-payment-examples).
Each example is included as a different module for proper encapsulation. Demo version of the example can be found in [Payment Examples Page](https://payment-examples.staging.oregon.platform-os.com)

  * [Charge Example](https://github.com/mdyd-dev/platformos-payment-examples/blob/master/modules/charge_example/public/views) - demonstrates how to include most basic payment scenarios with Stripe popup component and the ability to refund each payment. You can play with the example on [payment demo page](https://payment-examples.staging.oregon.platform-os.com/payments)
  * [Account Example](https://github.com/mdyd-dev/platformos-payment-examples/tree/master/modules/account_example/public/views) - in this example, you will learn how to integrate Stripe Connect with custom accounts support as well as how to process payments to connected accounts. [Demo page](https://payment-examples.staging.oregon.platform-os.com/account)
  * [Stripe Elements Example](https://github.com/mdyd-dev/platformos-payment-examples/tree/master/modules/elements_example) - Stripe Elements provide you with Credit Card form functionality that can be quickly added to any page. In this example, you will see how to approach two-step payments with Authorize and Capture. [Demo](https://payment-examples.staging.oregon.platform-os.com/elements)
  * [Customer Example](https://github.com/mdyd-dev/platformos-payment-examples/tree/master/modules/customer_example) - here you will learn the basics of saving your customers Credit Cards so they can be easily charged in the future without reading Credit Card details. [Demo](https://payment-examples.staging.oregon.platform-os.com/customer)


# How Payment Module Works

Payment module is a backbone for processing payments with third party API's of any payment gateway that is installed as separate module.
The entry point for any acction is `gateway_request_form` that can be used as embeded form or mutation as follows:

1. On any page include gateway_request_form with poper configuration:
  - gateway - name of module that define API communication with payment gateway (for now there is only stripe gateway available as separate module)
  - request_type - name of request that is prefedined in API communication module for example "create_payment" or "create_refund"
2. User visits the page where form is embeded.
3. Based on the value of "request_type" form content defined in `modules/stripe/public/views/partials/templates/[request_type]` is rendered in the browser.
3. On form submition request is processed with `gateway_request_form` and the code in `default_payload` is invoked:
4. Gateway API call is invoked with `gateway_request` mutation and API notification template based on request_type
5. Gateway response is processed with `response_mapper` defined in `modules/stripe/public/views/partials/response_mapper/[request_type]`
6. Customization is created/updated/deleted based on parsed response and it's type.

# Gateway Ruest Form configuration

When you include gateway_request_form on any page you need to pass two objects as parameters `data` and `config`: 

`{%-
  include_form 'modules/payments/gateway_request_form',
  config: config,
  data: data
%}
`

## Config Object
 
Configuration object holds the set of configuration options.

There are serveral options that are common to all the reuqest types:

- gateway - is the name of the gateway module e.g. "stripe". Please make sure that proper module is installed. 
- request_type - defines what kind of request you want to perform. All available requests are defined in `modules/[gateway]/public/notifications/api_call_notifications/[request_type].liquid`. See [Request Types Section](https://github.com/mdyd-dev/platformos-payments-stripe#manual-installation)] in Stripe Module Documentation.
- success_message - flash message text presented after successfull API request
- error_message - flash message text presented after unsuccessful API request
- success_path - point of redirection affter successful API request, default current path
- error_path - point of redirection after unsuccessful API request, default current path

Additionaly you can pass configuration options specific to the request type - for more details please refer to the documentation in of gateway module for chosen request type. The list of available request types for Stripe you can find on [ Stripe Module Readme Page ](https://github.com/mdyd-dev/platformos-payments-stripe#request-types)


## Data Object

Data object is used to pass all data to the payment gateway request. Object state is validated with secret key so it can not be altered by the user before it is send to the gateway. Each gateway request requires different data sets, please check in the [documentation](https://github.com/mdyd-dev/platformos-payments-stripe#request-types) what are the options for each request type.


## Example 1. create_payment 

Payment model represents money transfer from payment source (typically Credit Card) to payment receiver usually Payment Gateway.
Payment should be immutable, it should be successful or failed and should not be changed. If one payment fails for some reason (insufficient funds) you should not update the failed payment but create new one.

The easiest way to enable payment creation on your page is by simply embeding the form with proper configuration as in the example below.

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

# Customization of Payment Module

### Template Customization

When gateway_request_form is included on a page, predefined template for given request_type is rendered. For Stripe module you will find all those templates [here](https://github.com/mdyd-dev/platformos-payments-stripe/tree/master/public/views/partials/templates). If you need to customize it, use `gateway_template` configuration option to pass partial view of your choice. 

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

If you need to add additonal action after the payment gateway response was processed use `callback` config option to pass the path to the partial with code that will be executed after successful gateway request. 


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

In the partial you can invoke graphql mutation to update the state of any object in the database.

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
  email - Customers' email

Returns Array<modules/payments/customer>:
- gateway_id
- email
- default_source - ID of a default card of this user

## Retrieving customer's stored cards

To retrieve references to stored cards in stripe you can use:

```
{%- graphql g_cards = 'modules/payments/get_credit_cards_by_customer_id',
  customer_id: customer_id
-%}
```

Or you can fetch credit cards with Stripe Customer ID (external_id)

```
{%- graphql g_cards = 'modules/payments/get_credit_cards_by_external_id',
  external_id: external_id
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

