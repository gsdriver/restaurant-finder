# restaurant-finder

An Alexa skill that allows you to find restaurants near either a specificed location of the device's postal code.  Searches can be filtered based on several attributes such as price, category, or Yelp review ratings.  Customers can perform additional searches to further filter the list, or can read through the results five ata time.  The user can also pull up details on a specific restaurant which will be played to the user and displayed in a card in the companion app.

# Setup

`npm install`

# Conversation Flow

The conversation flows through a few different states:

* Empty: This is the state when the user first launches the skill, before they have done any searches
* RESULTS: In this state, the user has done a search.  The `attributes.lastSearch` and `attributes.lastResponse` fields are filled with the search performed and the restaurants found
* LIST: The user can read results five at a time.  While are reading results, they are in this state.  They can move forward and backwards through the result list.  Note that if there are five or fewer results that match the search terms, the user will go directly into the LIST state after doing a search.  `attributes.lastResult.read` keeps track of where they are in the list.  The full list is displayed on the device screen, if it supports the display directive
* DETAILS: Once the user has found a restaurant that they want to hear more details about, they enter this state.  `attributes.lastResponse.details` keeps track of which restaurant in the list is currently specifying details.  The user can go back to the LIST state from this point, or can do a new search.  Details are presented to the user via speech and a companion card, including a hero image.

# Directory structure

```
master/
  |
  |- node_modules/  npm dependencies - should not be checked-in
  |- test/          test folder
  |- intents/       Intents folder. Each sub-directory corresponds to a sub-flow
  |- api/           Modules that call external APIs
  |- index.js       Main entry point for this skill
  |- resources.js   Locale-specific resources
  |- utils.js       Utility functions
  |- .eslint.json   Any overrides over the default ESLint config should be set here
  \- package.json   Contains information about our node project and dependencies
```