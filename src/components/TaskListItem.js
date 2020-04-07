import React, { Component } from 'react'
import { StyleSheet, TouchableOpacity, TouchableHighlight, View, Dimensions } from 'react-native'
import { Icon, Text } from 'native-base'
import { Col, Row, Grid } from 'react-native-easy-grid'
import { SwipeRow } from 'react-native-swipe-list-view'
import PropTypes from 'prop-types'
import moment from 'moment'
import _ from 'lodash'
import { withTranslation } from 'react-i18next'

import { greenColor, lightGreyColor, redColor } from '../styles/common'
import {
  doneIconName,
  failedIconName,
  taskTypeIconName,
} from '../navigation/task/styles/common'

const styles = StyleSheet.create({
  itemLeftRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  itemBody: {
    padding: 10,
  },
  item: {
    borderBottomColor: lightGreyColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#ffffff',
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: 14,
  },
  textDanger: {
    color: redColor,
  },
  icon: {
    fontSize: 18,
  },
  iconDanger: {
    color: redColor,
  },
  rowBack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

class TaskListItem extends Component {

  constructor(props) {
    super(props)
    this.swipeRow = React.createRef()
  }

  _onTaskClick(task) {
    if (this.props.refreshing) {
      return
    }
    this.props.onTaskClick(task)
  }

  closeRow() {
    this.swipeRow.current.closeRow()
  }

  renderTaskStatusIcon(task) {
    let iconStyle = [ styles.icon ]
    switch (task.status) {
      case 'DONE':
        return (
          <Icon type="FontAwesome" name={ doneIconName } style={ iconStyle } />
        )
      case 'FAILED':
        iconStyle.push(styles.iconDanger)
        return (
          <Icon type="FontAwesome" name={ failedIconName } style={ iconStyle } />
        )
      default:
        return (
          <View />
        )
    }
  }

  renderSwipeoutButton(width, iconName) {

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width }}>
        <Icon type="FontAwesome" name={ iconName } style={{ color: '#fff' }} />
      </View>
    )
  }

  renderSwipeoutLeftButton(width) {

    return this.renderSwipeoutButton(width, this.props.swipeOutLeftIconName || doneIconName)
  }

  renderSwipeoutRightButton(width) {

    return this.renderSwipeoutButton(width, this.props.swipeOutRightIconName || failedIconName)
  }

  render() {

    const { task, index } = this.props

    const taskTypeIcon = taskTypeIconName(task)
    const isCompleted = _.includes(['DONE', 'FAILED'], task.status)

    let itemLeftStyle = [ styles.itemLeftRight ]
    let itemBodyStyle = [ styles.itemBody ]
    let textStyle = [ styles.text ]
    let iconStyle = [ styles.icon ]

    if (task.status === 'DONE') {
      itemLeftStyle.push(styles.disabled)
      itemBodyStyle.push(styles.disabled)
    }
    if (task.status === 'FAILED') {
      textStyle.push(styles.textDanger)
      iconStyle.push(styles.iconDanger)
      itemLeftStyle.push(styles.disabled)
      itemBodyStyle.push(styles.disabled)
    }

    let name
    const customerDetails = _.filter([ task.address.firstName, task.address.lastName ])
    if (customerDetails.length > 0) {
      name = customerDetails.join(' ')
    }

    const { width } = Dimensions.get('window')
    const buttonWidth = (width / 3)

    return (
      <SwipeRow
        disableRightSwipe={ this.props.disableRightSwipe }
        disableLeftSwipe={ this.props.disableLeftSwipe }
        leftOpenValue={ buttonWidth }
        stopLeftSwipe={ buttonWidth + 25 }
        rightOpenValue={ buttonWidth * -1 }
        stopRightSwipe={ (buttonWidth + 25) * -1 }
        ref={ this.swipeRow }>
        <View style={ [ styles.rowBack ] }>
          <TouchableOpacity
            style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center', backgroundColor: greenColor, width: buttonWidth }}
            onPress={ () => {
              this.swipeRow.current.closeRow()
              this.props.onPressLeft()
            }}
            testID={ `task:${index}:assign` }>
            { this.renderSwipeoutLeftButton(buttonWidth) }
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center', backgroundColor: redColor, width: buttonWidth }}
            onPress={ () => {
              this.swipeRow.current.closeRow()
              this.props.onPressRight()
            }}>
            { this.renderSwipeoutRightButton(buttonWidth) }
          </TouchableOpacity>
        </View>
        <TouchableHighlight onPress={ this.props.onPress } style={ styles.item } underlayColor={ '#efefef' } testID={ `task:${index}` }>
          <Grid style={{ paddingVertical: 10 }}>
            <Col size={ 1 } style={ itemLeftStyle }>
              <Row style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Icon type="FontAwesome" style={ iconStyle } name={ taskTypeIcon } />
              </Row>
              { isCompleted &&
              <Row style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              { this.renderTaskStatusIcon(task) }
              </Row>
              }
            </Col>
            <Col size={ 10 } style={ itemBodyStyle }>
              <Text style={ textStyle }>{this.props.t('TASK')} #{ task.id }</Text>
              { name ? (<Text style={ textStyle }>{ name }</Text>) : null }
              { task.address.name ? (<Text style={ textStyle }>{ task.address.name }</Text>) : null }
              <Text numberOfLines={ 1 } style={ textStyle }>{ task.address.streetAddress }</Text>
              <Text style={ textStyle }>{ moment(task.doneAfter).format('LT') } - { moment(task.doneBefore).format('LT') }</Text>
            </Col>
            <Col size={ 1 } style={ styles.itemLeftRight }>
              <Icon style={{ color: '#ccc' }} name="ios-arrow-forward" />
            </Col>
          </Grid>
        </TouchableHighlight>
      </SwipeRow>
    )
  }
}

TaskListItem.defaultProps = {
  onPress: () => {},
  onPressLeft: () => {},
  onPressRight: () => {},
}

TaskListItem.propTypes = {
  task: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onPress: PropTypes.func,
  onPressLeft: PropTypes.func,
  onPressRight: PropTypes.func,
}

// We need to use "withRef" prop,
// for react-native-swipe-list-view CellRenderer to not trigger a warning
export default withTranslation([ 'common' ], { withRef: true })(TaskListItem)
