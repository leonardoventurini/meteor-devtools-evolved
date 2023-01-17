import 'd3-transition'
import assert from 'assert'
import prettyBytes from 'pretty-bytes'
import { mouse, select, selectAll } from 'd3-selection'
import { arc } from 'd3-shape'
import { hierarchy, partition } from 'd3-hierarchy'
import { entries, keys } from 'd3-collection'
import { StringUtils } from '@/Utils/StringUtils'
import { isNil, isObject } from './Objects'

export const typeBundle = 'bundle'
export const typePackage = 'package'
export const typeNodeModules = 'node_modules'

const d3 = Object.assign(
  {},
  { selectAll, select, mouse },
  { arc },
  { hierarchy, partition },
  { keys, entries },
)

const width = 950
const height = 600
const radius = Math.min(width, height) / 2

const DEFAULT_COLORS = {
  _default_: '#ababab',
  [typeBundle]: '#de4f4f',
  [typePackage]: '#de783b',
  [typeNodeModules]: '#7b615c',
  meteor: '#6ab975',
  javascript: '#a173d1',
}

export class Sunburst {
  elements
  colors
  totalSize
  totalSizes
  mouseleave
  mouseover
  partition
  arc
  svg
  vis
  activeBundle
  root
  nodes
  path
  json

  constructor({ container = undefined, colors = DEFAULT_COLORS } = {}) {
    assert.ok(
      !isNil(container) && isObject(container),
      "Must pass a 'container' element",
    )

    this.elements = {}
    this.colors = colors
    this.totalSize = 0

    this.elements.container = d3.select(container)

    this.elements.main = this.elements.container
      .append('div')
      .attr('class', StringUtils.getPrefixedClass('main'))

    this.elements.pillContainer = this.elements.container
      .append('div')
      .attr('class', StringUtils.getPrefixedClass('pills'))

    this.elements.sequence = this.elements.main
      .append('div')
      .attr('class', StringUtils.getPrefixedClass('sequence'))

    this.elements.chart = this.elements.main
      .append('div')
      .attr('class', StringUtils.getPrefixedClass('chart'))

    this.elements.explanation = this.elements.chart
      .append('div')
      .attr('class', StringUtils.getPrefixedClass('explanation'))

    this.elements.percentage = this.elements.explanation
      .append('span')
      .attr('class', StringUtils.getPrefixedClass('percentage'))

    // BR between percentage and bytes.
    this.elements.explanation.append('br')

    this.elements.bytes = this.elements.explanation
      .append('span')
      .attr('class', StringUtils.getPrefixedClass('bytes'))

    this.partition = d3.partition().size([2 * Math.PI, radius * radius])

    this.arc = d3
      .arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => Math.sqrt(d.y0))
      .outerRadius(d => Math.sqrt(d.y1))

    this.svg = []
    this.vis = []
    this.totalSizes = []
  }

  getColor(data) {
    if (data.type === typePackage) {
      return this.colors[typePackage]
    }

    if (data.name.endsWith('.js')) {
      return this.colors.javascript
    }

    if (this.colors[data.name]) {
      return this.colors[data.name]
    }

    return this.colors._default_
  }

  initializeBreadcrumbTrail() {
    this.elements.trail = this.elements.container
      .append('div')
      .attr('class', StringUtils.getPrefixedClass('trail'))
  }

  createPills(json) {
    this.elements.pills = []
    json.children.forEach((child, i) => {
      const className =
        StringUtils.getPrefixedClass('pill') +
        (i ? '' : ` ${StringUtils.getPrefixedClass('active')}`)
      this.elements.pills.push(
        this.elements.pillContainer
          .append('div')
          .attr('class', className)
          .attr('name', child.name)
          .text(child.name)
          .on('click', () => this.handlePillClick(child.name)),
      )
    })
  }

  handlePillClick(name) {
    this.elements.pills.forEach((pill, i) => {
      const className =
        pill.attr('name') === name
          ? `${StringUtils.getPrefixedClass(
              'pill',
            )} ${StringUtils.getPrefixedClass('active')}`
          : StringUtils.getPrefixedClass('pill')

      pill.attr('class', className)
      if (pill.attr('name') === name) {
        this.svg[i].style('display', null)
        this.totalSize = this.totalSizes[i]
        this.activeBundle = i
      } else {
        this.svg[i].style('display', 'none')
      }
    })
  }

  draw(json) {
    const svg = this.elements.chart
      .append('svg:svg')
      .attr('width', width)
      .attr('height', height)
      .style('display', 'none')

    const vis = svg
      .append('svg:g')
      .attr('class', StringUtils.getPrefixedClass('top'))
      .attr('transform', `translate(${width / 2},${height / 2})`)

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    vis.append('svg:circle').attr('r', radius).style('opacity', 0)

    // Add the mouseleave handler to the bounding circle.
    vis.on('mouseleave', this.mouseleaveEvent())

    // Turn the data into a d3 hierarchy and calculate the sums.
    this.root = d3
      .hierarchy(json)
      .sum(d => d.size)
      .sort((a, b) => b.value - a.value)

    // For efficiency, filter nodes to keep only those large enough to see.
    this.nodes = this.partition(this.root)
      .descendants()
      .filter(d => d.x1 - d.x0 > 0.005) // 0.005 radians = 0.29 degrees

    this.path = vis
      .data([json])
      .selectAll('path')
      .data(this.nodes)
      .enter()
      .append('svg:path')
      .attr('display', d => (d.depth ? null : 'none'))
      .attr('d', this.arc)
      .attr('fill-rule', 'evenodd')
      .style('fill', d => this.getColor(d.data))
      .style('opacity', 1)
      .on('mouseover', this.mouseoverEvent())

    // // Get total size of the tree = value of root node from partition.
    const totalSize = this.path.datum().value

    this.svg.push(svg)
    this.vis.push(vis)
    this.totalSizes.push(totalSize)
  }

  loadJson(json) {
    // Draw the starburst for the each bundle
    json.children.forEach(bundle =>
      this.draw({ name: 'main', children: [bundle] }),
    )

    // Basic setup of page elements.
    this.json = json
    this.createPills(json)
    this.initializeBreadcrumbTrail()

    this.svg[0].style('display', null)
    this.activeBundle = 0
  }

  mouseoverEvent() {
    return (
      this.mouseover ||
      (this.mouseover = d => {
        const percentage = (100 * d.value) / this.totalSizes[this.activeBundle]

        let percentageString = ''

        if (percentage < 0.1) {
          percentageString = '< 0.1%'
        } else {
          percentageString = `${percentage.toPrecision(3)}%`
        }

        this.elements.percentage.text(percentageString)

        this.elements.bytes.text(prettyBytes(d.value || 0))

        this.elements.explanation.style('display', null)

        const sequenceArray = d.ancestors().reverse()
        sequenceArray.shift() // remove root node from the array
        this.updateBreadcrumbs(sequenceArray, percentageString)

        // Fade all the segments.
        d3.selectAll('path').style('opacity', 0.3)

        // Then highlight only those that are an ancestor of the current segment.
        this.vis[this.activeBundle]
          .selectAll('path')
          .filter(node => sequenceArray.indexOf(node) >= 0)
          .style('opacity', 1)
      })
    )
  }

  // Restore everything to full opacity when moving off the visualization.
  mouseleaveEvent() {
    const self = this

    return (
      self.mouseleave ||
      (self.mouseleave = function (d) {
        // Hide the breadcrumb trail
        self.elements.trail.style('visibility', 'hidden')

        // Deactivate all segments during transition.
        d3.selectAll('path').on('mouseover', null)

        // Transition each segment to full opacity and then reactivate it.
        d3.selectAll('path')
          .transition()
          .duration(1000)
          .style('opacity', 1)
          .on('end', function () {
            d3.select(this).on('mouseover', self.mouseoverEvent())
          })

        self.elements.explanation.style('display', 'none')
      })
    )
  }

  // Update the breadcrumb trail to show the current sequence and percentage.
  updateBreadcrumbs(nodeArray, percentageString) {
    // Data join; key function combines name and depth (= position in sequence).
    const trail = this.elements.trail
      .selectAll('div')
      .data(nodeArray, d => d.data.name + d.depth)

    // Remove exiting nodes.
    trail.exit().remove()

    // Add breadcrumb and label for entering nodes.
    const entering = trail
      .enter()
      .append('div')
      .attr('class', StringUtils.getPrefixedClass('trailSegment'))
      .style('background-color', d => this.getColor(d.data))
      .text(d => d.data.name)

    // Merge enter and update selections; set position for all nodes.
    entering.merge(trail)

    // Make the breadcrumb trail visible, if it's hidden.
    this.elements.trail.style('visibility', '')
  }
}
