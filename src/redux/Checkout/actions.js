import { createAction } from 'redux-actions'
import { StackActions, NavigationActions } from 'react-navigation'

import NavigationHolder from '../../NavigationHolder'

/*
 * Action Types
 */
export const INIT = 'CHECKOUT_INIT'
export const ADD_ITEM = 'ADD_ITEM'
export const REMOVE_ITEM = 'REMOVE_ITEM'
export const INCREMENT_ITEM = 'INCREMENT_ITEM'
export const DECREMENT_ITEM = 'DECREMENT_ITEM'
export const SET_ADDRESS_RESOURCE = 'SET_ADDRESS_RESOURCE'
export const CLEAR = 'CHECKOUT_CLEAR'

export const SEARCH_RESTAURANTS_REQUEST = '@checkout/SEARCH_RESTAURANTS_REQUEST'
export const SEARCH_RESTAURANTS_SUCCESS = '@checkout/SEARCH_RESTAURANTS_SUCCESS'
export const SEARCH_RESTAURANTS_FAILURE = '@checkout/SEARCH_RESTAURANTS_FAILURE'

export const CHECKOUT_REQUEST = '@checkout/CHECKOUT_REQUEST'
export const CHECKOUT_SUCCESS = '@checkout/CHECKOUT_SUCCESS'
export const CHECKOUT_FAILURE = '@checkout/CHECKOUT_FAILURE'

/*
 * Action Creators
 */
export const init = createAction(INIT, (restaurant, address, date) => ({ restaurant, address, date }))
export const addItem = createAction(ADD_ITEM, (item, options = []) => ({ item, options }))
export const removeItem = createAction(REMOVE_ITEM)
export const incrementItem = createAction(INCREMENT_ITEM)
export const decrementItem = createAction(DECREMENT_ITEM)
export const setAddressResource = createAction(SET_ADDRESS_RESOURCE)
export const clear = createAction(CLEAR)

export const searchRestaurantsRequest = createAction(SEARCH_RESTAURANTS_REQUEST)
export const searchRestaurantsSuccess = createAction(SEARCH_RESTAURANTS_SUCCESS)
export const searchRestaurantsFailure = createAction(SEARCH_RESTAURANTS_FAILURE)

export const checkoutRequest = createAction(CHECKOUT_REQUEST)
export const checkoutSuccess = createAction(CHECKOUT_SUCCESS)
export const checkoutFailure = createAction(CHECKOUT_FAILURE)

export function searchRestaurants(latitude, longitude, date) {

  return (dispatch, getState) => {

    const { httpClient } = getState().app

    dispatch(searchRestaurantsRequest())

    httpClient.get('/api/restaurants?coordinate=' + [latitude, longitude])
      .then(res => {

        const restaurants = res['hydra:member']

        Promise
          .all(restaurants.map(restaurant => {
            // Load from API if this is an IRI
            if (typeof restaurant.hasMenu === 'string') {

              return httpClient.get(restaurant.hasMenu)
            }

            return new Promise((resolve, reject) => resolve(restaurant.hasMenu))
          }))
          .then(values => restaurants.map((restaurant, key) => ({ ...restaurant, hasMenu: values[key] })))
          .then(restaurantsWithMenu => {
            if (date) {

              return _.filter(restaurantsWithMenu, restaurant => {
                for (let i = 0; i < restaurant.availabilities.length; i++) {
                  if (moment(restaurant.availabilities[i]).isSame(date, 'day')) {

                    return true
                  }
                }

                return false
              })
            }

            return restaurantsWithMenu
          })
          .then(restaurantsWithMenu => {
            dispatch(searchRestaurantsSuccess(restaurantsWithMenu))
          })
      })
  }
}

export function checkout(token) {

  return (dispatch, getState) => {

    const { httpClient } = getState().app
    const { addressResource, cart, date } = getState().checkout

    const newCart = cart.clone()
    newCart.setDeliveryAddress(addressResource)
    newCart.setDeliveryDate(date)

    dispatch(checkoutRequest())

    httpClient
      .post('/api/orders', newCart.toJSON())
      .then(order => httpClient.put(order['@id'] + '/pay', { stripeToken: token.tokenId }))
      .then(order => {

        // @see https://reactnavigation.org/docs/en/stack-actions.html
        const resetAction = StackActions.reset({
          index: 2,
          actions: [
            NavigationActions.navigate({ routeName: 'AccountHome' }),
            NavigationActions.navigate({ routeName: 'AccountOrders' }),
            NavigationActions.navigate({ routeName: 'OrderTracking', params: { order } }),
          ]
        })
        NavigationHolder.dispatch(resetAction)

        // Make sure to clear AFTER navigation has been reset
        dispatch(checkoutSuccess(order))
      })
      .catch(e => dispatch(checkoutFailure(e)))
  }
}
