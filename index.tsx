import {PureComponent} from 'react';
import {
  Animated,
  PanResponder,
  PanResponderInstance,
  StyleProp,
  TouchableHighlight,
  View,
  ViewStyle
} from 'react-native';
import * as React from "react";

type Props = {
  active: boolean,
  style: StyleProp<ViewStyle>,
  inactiveButtonColor: string,
  inactiveButtonPressedColor: string,
  activeButtonColor: string,
  activeButtonPressedColor: string,
  buttonShadow: StyleProp<ViewStyle>,
  activeBackgroundColor: string,
  inactiveBackgroundColor: string,
  buttonRadius: number,
  switchWidth: number,
  switchHeight: number,
  buttonContent: JSX.Element,
  buttonOffset: number;
  enableSlide: boolean,
  enableSlideDragging: boolean,
  switchAnimationTime: number,
  onActivate: () => void,
  onDeactivate: () => void,
  onChangeState: (active: boolean) => void,
}

type State = {
  width: number;
  state: boolean;
  position: any;
  pressed?: boolean;
}

export default class MaterialSwitch extends PureComponent<Props, State> {
  static defaultProps = {
    active: false,
    style: {},
    inactiveButtonColor: '#2196F3',
    inactiveButtonPressedColor: '#42A5F5',
    activeButtonColor: '#FAFAFA',
    activeButtonPressedColor: '#F5F5F5',
    buttonShadow: {
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowRadius: 1,
      shadowOffset: {height: 1, width: 0},
    },
    activeBackgroundColor: 'rgba(255,255,255,.5)',
    inactiveBackgroundColor: 'rgba(0,0,0,.5)',
    buttonRadius: 15,
    switchWidth: 40,
    switchHeight: 20,
    buttonContent: null,
    buttonOffset: 0,
    enableSlide: true,
    enableSlideDragging: true,
    switchAnimationTime: 200,
    onActivate: () => ({}),
    onDeactivate: () => ({}),
    onChangeState: () => ({}),
  };

  private _panResponder: PanResponderInstance;
  private start: any = {};
  private padding = 8

  constructor(props) {
    super(props);

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        if (!this.props.enableSlide) return;

        this.setState({pressed: true});
        this.start.x0 = gestureState.x0;
        this.start.pos = this.state.position._value;
        this.start.moved = false;
        this.start.state = this.state.state;
        this.start.stateChanged = false;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!this.props.enableSlide) return;

        this.start.moved = true;
        if (this.start.pos == 0) {
          if (gestureState.dx <= this.state.width && gestureState.dx >= 0) {
            this.state.position.setValue(gestureState.dx);
          }
          if (gestureState.dx > this.state.width) {
            this.state.position.setValue(this.state.width);
          }
          if (gestureState.dx < 0) {
            this.state.position.setValue(0);
          }
        }
        if (this.start.pos == this.state.width) {
          if (gestureState.dx >= -this.state.width && gestureState.dx <= 0) {
            this.state.position.setValue(this.state.width + gestureState.dx);
          }
          if (gestureState.dx > 0) {
            this.state.position.setValue(this.state.width);
          }
          if (gestureState.dx < -this.state.width) {
            this.state.position.setValue(0);
          }
        }
        const currentPos = this.state.position._value;
        this.onSwipe(currentPos, this.start.pos,
          () => {
            if (!this.start.state) this.start.stateChanged = true;
            this.setState({state: true})
          },
          () => {
            if (this.start.state) this.start.stateChanged = true;
            this.setState({state: false})
          });
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        this.setState({pressed: false});
        const currentPos = this.state.position._value;
        if (!this.start.moved || (Math.abs(currentPos - this.start.pos) < 5 && !this.start.stateChanged)) {
          this.toggle();
          return;
        }
        this.onSwipe(currentPos, this.start.pos, this.activate, this.deactivate);
      },
      onPanResponderTerminate: (evt, gestureState) => {
        var currentPos = this.state.position._value;
        this.setState({pressed: false});
        this.onSwipe(currentPos, this.start.pos, this.activate, this.deactivate);
      },
      onShouldBlockNativeResponder: (evt, gestureState) => true,
    });

    const w = (this.props.switchWidth - Math.min(this.props.switchHeight, this.props.buttonRadius * 2) - this.props.buttonOffset);

    this.state = {
      width: w,
      state: this.props.active,
      position: new Animated.Value(this.props.active ? w : this.props.buttonOffset),
    };
  }

  componentDidUpdate(prevProps) {
    if (this.state.state !== this.props.active) {
      this.props.active ? this.activate() : this.deactivate()
    }
  }

  render() {
    const doublePadding = this.padding * 2 - 2;
    const halfPadding = doublePadding / 2;

    let panHandlers = this.props.enableSlideDragging ? this._panResponder.panHandlers : null
    let pressHandlers = !this.props.enableSlideDragging ? {onPress: () => this.toggle()} : null

    return (
      <View
        {...panHandlers}
        style={[{padding: this.padding, position: 'relative'}, this.props.style]}>
        <View
          style={{
            backgroundColor: this.state.state ? this.props.activeBackgroundColor : this.props.inactiveBackgroundColor,
            height: this.props.switchHeight,
            width: this.props.switchWidth,
            borderRadius: this.props.switchHeight / 2,
          }}/>
        <TouchableHighlight {...pressHandlers} underlayColor='transparent' activeOpacity={1} style={{
          height: Math.max(this.props.buttonRadius * 2 + doublePadding, this.props.switchHeight + doublePadding),
          width: this.props.switchWidth + doublePadding,
          position: 'absolute',
          top: 1,
          left: 1
        }}>
          <Animated.View style={[{
            backgroundColor:
              this.state.state
                ? (this.state.pressed ? this.props.activeButtonPressedColor : this.props.activeButtonColor)
                : (this.state.pressed ? this.props.inactiveButtonPressedColor : this.props.inactiveButtonColor),
            height: this.props.buttonRadius * 2,
            width: this.props.buttonRadius * 2,
            borderRadius: this.props.buttonRadius,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            position: 'absolute',
            top: halfPadding + this.props.switchHeight / 2 - this.props.buttonRadius,
            left: this.props.switchHeight / 2 > this.props.buttonRadius ? halfPadding : halfPadding + this.props.switchHeight / 2 - this.props.buttonRadius,
            transform: [{translateX: this.state.position}]
          },
            this.props.buttonShadow]}
          >
            {this.props.buttonContent}
          </Animated.View>
        </TouchableHighlight>
      </View>
    )
  }

  onSwipe(currentPosition, startingPosition, onChange, onTerminate) {
    if (currentPosition - startingPosition >= 0) {
      if (currentPosition - startingPosition > this.state.width / 2 || startingPosition == this.state.width) {
        onChange();
      } else {
        onTerminate();
      }
    } else {
      if (currentPosition - startingPosition < -this.state.width / 2) {
        onTerminate();
      } else {
        onChange();
      }
    }
  }

  activate() {
    Animated.timing(
      this.state.position,
      {
        toValue: this.state.width,
        duration: this.props.switchAnimationTime,
        useNativeDriver: true,
      }
    ).start();
    this.changeState(true);
  }

  deactivate() {
    Animated.timing(
      this.state.position,
      {
        toValue: this.props.buttonOffset,
        duration: this.props.switchAnimationTime,
        useNativeDriver: true,
      }
    ).start();
    this.changeState(false);
  }

  changeState(state) {
    const callHandlers = this.start.state != state;
    setTimeout(() => {
      this.setState({state: state});
      if (callHandlers) {
        this.callback();
      }
    }, this.props.switchAnimationTime / 2);
  }

  callback() {
    const state = this.state.state;
    if (state) {
      this.props.onActivate();
    } else {
      this.props.onDeactivate();
    }
    this.props.onChangeState(state);
  }

  toggle() {
    if (!this.props.enableSlide) return;

    if (this.state.state) {
      this.deactivate();
    } else {
      this.activate();
    }
  }
}
