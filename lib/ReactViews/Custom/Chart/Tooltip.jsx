import { observer } from "mobx-react";
import { computed } from "mobx";
import { Tooltip as VxTooltip } from "@vx/tooltip";
import { CSSTransition } from "react-transition-group";
import PropTypes from "prop-types";
import React from "react";
import dateformat from "dateformat";
import groupBy from "lodash-es/groupBy";
import Styles from "./tooltip.scss";

@observer
class Tooltip extends React.Component {
  static propTypes = {
    items: PropTypes.array.isRequired,
    left: PropTypes.number,
    right: PropTypes.number,
    top: PropTypes.number,
    bottom: PropTypes.number
  };

  prevItems = [];

  @computed
  get items() {
    // When items` is unset, hold on to its last value. We do this because we
    // want to keep showing the tooltip. We then fade it out using the
    // CSSTransition below.
    const items = this.props.items;
    if (items && items.length > 0) {
      this.prevItems = items;
      return items;
    } else {
      return this.prevItems;
    }
  }

  @computed
  get title() {
    const items = this.items;
    if (items.length > 0) {
      // derive title from first item x
      const x = items[0].point.x;
      return x instanceof Date ? dateformat(x, "dd/mm/yyyy, HH:MMTT") : x;
    } else return undefined;
  }

  @computed
  get groups() {
    // momentLines and momentPoints are not shown in the tooltip body
    const tooltipItems = this.items.filter(
      ({ chartItem }) =>
        chartItem.type !== "momentLines" && chartItem.type !== "momentPoints"
    );
    return Object.entries(groupBy(tooltipItems, "chartItem.categoryName")).map(
      o => ({
        name: o[0],
        items: o[1]
      })
    );
  }

  @computed
  get style() {
    const { left, right, top, bottom } = this.props;
    return {
      left: left === undefined ? undefined : `${left}px`,
      right: right === undefined ? undefined : `${right}px`,
      top: top === undefined ? undefined : `${top}px`,
      bottom: bottom === undefined ? undefined : `${bottom}px`
    };
  }

  render() {
    const { items } = this.props;
    const show = items.length > 0;
    return (
      <CSSTransition
        in={show}
        classNames={{ ...Styles }}
        timeout={1000}
        unmountOnExit
      >
        <VxTooltip
          className={Styles.tooltip}
          key={Math.random()}
          style={this.style}
        >
          <div className={Styles.title}>{this.title}</div>
          <div>
            <For each="group" of={this.groups}>
              <TooltipGroup
                key={`tooltip-group-${group.name}`}
                name={this.groups.length > 1 ? group.name : undefined}
                items={group.items}
              />
            </For>
          </div>
        </VxTooltip>
      </CSSTransition>
    );
  }
}

class TooltipGroup extends React.PureComponent {
  static propTypes = {
    name: PropTypes.string,
    items: PropTypes.array.isRequired
  };

  render() {
    const { name, items } = this.props;
    return (
      <div className={Styles.group}>
        {name && <div className={Styles.groupName}>{name}</div>}
        <For each="item" of={items}>
          <TooltipItem key={`tooltipitem-${item.chartItem.key}`} item={item} />
        </For>
      </div>
    );
  }
}

@observer
class TooltipItem extends React.Component {
  static propTypes = {
    item: PropTypes.object.isRequired
  };

  render() {
    const chartItem = this.props.item.chartItem;
    const value = this.props.item.point.y;
    const formattedValue = isNaN(value) ? value : value.toFixed(2);
    return (
      <div className={Styles.item}>
        <div
          className={Styles.itemSymbol}
          style={{ backgroundColor: chartItem.getColor() }}
        />
        <div className={Styles.itemName}>{chartItem.name}</div>
        <div className={Styles.itemValue}>{formattedValue}</div>
        <div className={Styles.itemUnits}>{chartItem.units}</div>
      </div>
    );
  }
}

export default Tooltip;
