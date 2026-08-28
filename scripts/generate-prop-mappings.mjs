/**
 * Generates src/data/generated-prop-mappings.ts from exactly two files:
 *   docs/components-props-spinbox.json          (Spinbox design system)
 *   docs/components-props-pagopop-parity.json   (Spin Legacy / pagopop-mobile)
 *
 * Nothing is invented here. Every prop pair and every variant pair comes from a
 * declared type in one of those files; anything the files do not describe is
 * emitted as `N/A` and flagged so it shows up for review in the UI.
 *
 * Run: node scripts/generate-prop-mappings.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const spinbox = JSON.parse(fs.readFileSync(path.join(root, 'docs/components-props-spinbox.json'), 'utf8'))
const parity = JSON.parse(fs.readFileSync(path.join(root, 'docs/components-props-pagopop-parity.json'), 'utf8'))

const NA = 'N/A'

/* ------------------------------------------------------------------ *
 * Noise filters
 * ------------------------------------------------------------------ */

/**
 * React Native / DOM plumbing that says nothing about the design system.
 * Both files expose the full inherited RN surface (Logo alone reports 158 props),
 * so these have to go or the real API is buried.
 */
const RN_BOILERPLATE = new Set([
  'children', 'style', 'id', 'nativeID', 'collapsable', 'collapsableChildren', 'focusable', 'tabIndex',
  'needsOffscreenAlphaCompositing', 'renderToHardwareTextureAndroid', 'shouldRasterizeIOS',
  'isTVSelectable', 'hasTVPreferredFocus', 'removeClippedSubviews', 'pointerEvents', 'onLayout',
  'toString', 'toFixed', 'toExponential', 'toPrecision', 'valueOf', 'toLocaleString',
  'role', 'hitSlop', 'screenReaderFocusable', 'onMagicTap', 'delayPressIn', 'delayPressOut',
  'delayLongPress', 'onStartShouldSetResponderCapture', 'onMoveShouldSetResponderCapture',
  'dataSet', 'ref', 'key', 'theme', 'as',
])

/** Prefixes that only ever introduce platform plumbing. */
const RN_NOISE_PATTERN =
  /^(aria-|accessibility|onAccessibility|onResponder|onStartShouldSet|onMoveShouldSet|onTouch|onPointer|tvParallax)/

/**
 * react-native-svg surface. Only stripped from components that are actually SVG
 * (detected via `viewBox`), because names like `mask` and `filter` are real
 * domain props on the Legacy input components.
 */
const SVG_NOISE = new Set([
  'viewBox', 'preserveAspectRatio', 'opacity', 'fill', 'fillOpacity', 'fillRule', 'stroke', 'strokeOpacity',
  'strokeDasharray', 'strokeDashoffset', 'strokeLinecap', 'strokeLinejoin', 'strokeMiterlimit', 'vectorEffect',
  'clipRule', 'clipPath', 'translate', 'translateX', 'translateY', 'origin', 'originX', 'originY', 'scale',
  'scaleX', 'scaleY', 'skew', 'skewX', 'skewY', 'rotation', 'x', 'y', 'transform', 'marker', 'markerStart',
  'markerMid', 'markerEnd', 'mask', 'filter', 'font', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch',
  'fontSize', 'fontFamily', 'textAnchor', 'textDecoration', 'letterSpacing', 'wordSpacing', 'kerning',
  'fontFeatureSettings', 'fontVariantLigatures', 'fontVariationSettings',
])

/**
 * Enum props that describe platform behaviour rather than a design variant.
 * These would otherwise flood the variant list for every input component.
 */
const AXIS_BLOCKLIST = new Set([
  'autoCapitalize', 'autoComplete', 'textAlign', 'textAlignVertical', 'verticalAlign', 'pointerEvents',
  'importantForAccessibility', 'importantForAutofill', 'accessibilityLiveRegion', 'aria-live',
  'clearButtonMode', 'keyboardAppearance', 'keyboardType', 'returnKeyType', 'textContentType',
  'lineBreakStrategyIOS', 'lineBreakModeIOS', 'textBreakStrategy', 'animationType', 'enterKeyHint',
  'inputMode', 'role', 'accessibilityRole', 'dataDetectorTypes', 'submitBehavior', 'spellCheck',
  'backdropPressBehavior',
])

/** Icon-name unions and typography scales are pickers, not variants. */
const AXIS_MAX_OPTIONS = 14

/** Domain-relevant props for input-heavy components whose RN surface is huge. */
const INPUT_DOMAIN_PROPS = new Set([
  'value', 'onChangeText', 'onFocus', 'onBlur', 'label', 'placeholder', 'variant', 'helperMessage', 'status',
  'mask', 'maxLength', 'height', 'backgroundColor', 'showCharacterCounter', 'showLabelWhenFalsyValue',
  'leadingContent', 'trailingContent', 'disabled', 'inverted', 'errorMessage', 'helperAlignment', 'currency',
  'localeString', 'valueLengthToChangeFontSize', 'labelBackgroundColor', 'labelBackgroundColorInverted',
  'tokenLength', 'onTokenChange', 'initValue', 'masked', 'testID', 'accessible', 'accessibilityLabel',
  'accessibilityHint', 'hitSlop', 'containerStyle', 'size', 'decimals', 'formatOnBlur', 'onChangeDecimalText',
  'loading', 'helpMessage', 'hasError', 'leftIcon', 'rightIcon', 'inputContainerStyle', 'labelStyle',
  'isRequiredField', 'startAdornment', 'codeLength', 'cellSize', 'cellSpacing', 'password', 'onFulfill',
  'onBackspace', 'isLoading', 'error', 'isSuccess', 'successMessage', 'helpText', 'cellStyle',
  'cellStyleFocused', 'cellStyleFilled', 'textStyleFocused', 'extraItemAtCell', 'extraItemAtCellPosition',
  'restrictToNumbers', 'animated', 'animationFocused', 'inputProps', 'showLeftIcon', 'showRightIconItem',
  'isSearchable', 'itemList', 'loadingData', 'onSelectItem', 'onOpen', 'searchInputPlaceholder',
  'disabledInputSearch', 'showAvatar', 'initialSizeBottom', 'isEditingIcons', 'message', 'icon',
  'contentStyle', 'onShowTooltip', 'placement', 'content', 'isVisible', 'onClose', 'onRequestClose', 'steps',
  'showStepIndicator', 'showCloseButton', 'duration', 'width', 'overlay', 'title', 'body', 'onPress', 'type',
  'focused', 'success', 'allowRealNumber', 'formatWithoutCurrencySymbol', 'hideErrorMessageAndShowErrorIcon',
  'multiline', 'numberOfLines', 'secureTextEntry', 'editable', 'autoFocus', 'onSubmitEditing', 'defaultValue',
])

/* ------------------------------------------------------------------ *
 * Prop-name aliases (inferred pairs — always reported as `renamed`)
 * ------------------------------------------------------------------ */

const ALIASES = {
  label: ['title', 'text', 'name', 'buttonTitle'],
  title: ['label', 'header', 'bannerText'],
  text: ['title', 'label', 'message'],
  message: ['text', 'body', 'label'],
  onPress: ['onToggle', 'onCheck', 'onChangeValue', 'onIconPress', 'onPressedBackButton', 'onAction'],
  onToggle: ['onValueChange', 'onChangeValue', 'onPress'],
  onValueChange: ['onToggle', 'onChangeValue'],
  selected: ['checked', 'value', 'isRadioButtonVisible'],
  checked: ['selected', 'value'],
  isLoading: ['loading'],
  loading: ['isLoading'],
  iconName: ['icon', 'name'],
  icon: ['iconName'],
  expandedContent: ['body'],
  body: ['expandedContent', 'content'],
  header: ['title'],
  expanded: ['open', 'show'],
  show: ['open', 'expanded', 'isVisible'],
  open: ['show', 'expanded', 'isVisible'],
  isVisible: ['show', 'open', 'visible'],
  onClose: ['onClosePress', 'onRequestClose'],
  error: ['hasError'],
  status: ['hasError', 'success'],
  helperMessage: ['helpMessage', 'helpText', 'successMessage'],
  initValue: ['defaultValue'],
  tokenLength: ['codeLength'],
  onChangeText: ['onChangeDecimalText'],
  onTokenChange: ['onFulfill'],
  containerStyle: ['containerStyles', 'contentStyle', 'customStyles'],
  disabled: ['isDisabledTouchable', 'disabledInputSearch'],
  resizeMode: ['resizeImageMode'],
  image: ['avatar', 'source', 'uri'],
  initials: ['name'],
  showBadge: ['showSpinBadge'],
  badgeIcon: ['spinBadgeIconProps'],
  variant: ['type', 'color'],
  type: ['variant'],
  color: ['variant'],
  placeholder: ['searchInputPlaceholder'],
  totalSteps: ['numberOfSteps'],
  currentStep: ['activeStep'],
  textStyle: ['titleStyle', 'labelStyle'],
  titleStyle: ['textStyle'],
  buttonStyle: ['containerStyle'],
  wrapperStyle: ['containerStyle'],
  leadingContent: ['leftElement', 'leftIcon'],
  trailingContent: ['rightElement', 'rightIcon'],
  divider: ['showDivider'],
  gradient: ['customGradient'],
  strokeColor: ['containerBorderColor'],
  iconPosition: ['iconRight'],
  inverted: ['inverted'],
  onDismiss: ['onClose'],
}

/* ------------------------------------------------------------------ *
 * Variant-value synonyms (reported as `similar`)
 * ------------------------------------------------------------------ */

/**
 * Lexical equivalences between the two systems that are safe to assert.
 * Everything not listed here and not equal after normalisation stays N/A.
 */
const VALUE_SYNONYMS = [
  ['filled', 'solid'],
  ['outlined', 'outline'],
  ['clean', 'clear'],
  ['outlined-destructive', 'delete'],
  ['informational', 'info'],
  ['points', 'premia'],
  ['urgent', 'error'],
  ['paused', 'warning'],
  ['paused', 'pending'],
]

/** Prop names that all describe "which visual variant is this". */
const AXIS_FAMILY = ['variant', 'type', 'color', 'severity', 'mode', 'appearance']

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function componentProps(component, domainOnly = false) {
  if (!component) return []
  const fromTop = component.props || []
  const fromTypes = (component.propTypes || []).flatMap((group) => group.props || [])
  const all = [...fromTop, ...fromTypes]
  const isSvg = all.some((prop) => prop?.name === 'viewBox')

  const map = new Map()
  for (const prop of all) {
    if (!prop?.name || map.has(prop.name)) continue
    if (RN_BOILERPLATE.has(prop.name)) continue
    if (RN_NOISE_PATTERN.test(prop.name)) continue
    if (isSvg && SVG_NOISE.has(prop.name)) continue
    if (domainOnly && !INPUT_DOMAIN_PROPS.has(prop.name) && !/^(show|is|has)[A-Z]/.test(prop.name)) continue
    map.set(prop.name, prop)
  }
  return [...map.values()]
}

/** Returns the string-literal options of a union type, or null when it is not one. */
function enumOptions(type) {
  if (!type) return null
  const text = String(type).replace(/\s+/g, ' ').trim()
  if (!text.includes('"')) return null
  // Only accept pure unions of string literals (plus undefined/null).
  if (!/^("[^"]*"|\||undefined|null|\s)+$/.test(text)) return null
  const matches = text.match(/"[^"]+"/g)
  if (!matches) return null
  return matches.map((match) => match.slice(1, -1))
}

/** Enum props that read as design variants: colour, size, shape, emphasis… */
function variantAxes(component) {
  const axes = []
  for (const prop of componentProps(component)) {
    if (AXIS_BLOCKLIST.has(prop.name)) continue
    const options = enumOptions(prop.type)
    if (!options || options.length === 0) continue
    if (options.length > AXIS_MAX_OPTIONS) continue
    axes.push({ name: prop.name, options, description: prop.description || '', type: prop.type || '' })
  }
  return axes
}

/** `urgent_content` and `urgent` collapse to the same key; `-` and `_` are equivalent. */
function normaliseValue(value) {
  return String(value)
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-(content|surface|decoration|color|fill)$/g, '')
}

function areSynonyms(a, b) {
  const left = normaliseValue(a)
  const right = normaliseValue(b)
  return VALUE_SYNONYMS.some(
    ([x, y]) => (x === left && y === right) || (x === right && y === left),
  )
}

function compareValues(spinboxValue, legacyValue) {
  if (spinboxValue === legacyValue) return 'exact'
  if (normaliseValue(spinboxValue) === normaliseValue(legacyValue)) return 'similar'
  if (areSynonyms(spinboxValue, legacyValue)) return 'similar'
  return null
}

function sameAxisFamily(a, b) {
  return AXIS_FAMILY.includes(a) && AXIS_FAMILY.includes(b)
}

function shortType(type) {
  if (!type) return ''
  return String(type).replace(/\s+/g, ' ').trim().slice(0, 140)
}

/* ------------------------------------------------------------------ *
 * Variant pairing
 * ------------------------------------------------------------------ */

/**
 * Pairs enum values axis by axis. Unmatched values on either side become an
 * explicit N/A row so the gap is visible instead of silently guessed.
 */
function buildVariants(spinboxComponent, legacyComponent) {
  const spinboxAxesList = variantAxes(spinboxComponent)
  const legacyAxesList = variantAxes(legacyComponent)
  const rows = []
  const usedLegacyAxes = new Set()

  for (const axis of spinboxAxesList) {
    // Same prop name first, then the "which variant is this" family.
    let counterpart =
      legacyAxesList.find((candidate) => candidate.name === axis.name && !usedLegacyAxes.has(candidate.name)) ??
      legacyAxesList.find(
        (candidate) => sameAxisFamily(axis.name, candidate.name) && !usedLegacyAxes.has(candidate.name),
      ) ??
      null

    if (!counterpart) {
      const reason = legacyComponent
        ? `Legacy \`${legacyComponent.name}\` no declara ningún prop equivalente a \`${axis.name}\` en el JSON de parity.`
        : 'No hay componente Legacy en components-props-pagopop-parity.json.'
      for (const option of axis.options) {
        rows.push({
          axis: axis.name,
          spinboxName: `${axis.name}=${option}`,
          legacyName: NA,
          confidence: 'spinbox-only',
          reviewReason: reason,
          notes: axis.description,
        })
      }
      continue
    }

    usedLegacyAxes.add(counterpart.name)

    const matchedLegacy = new Set()
    const pairs = []
    for (const option of axis.options) {
      let best = null
      for (const legacyOption of counterpart.options) {
        if (matchedLegacy.has(legacyOption)) continue
        const kind = compareValues(option, legacyOption)
        if (!kind) continue
        if (!best || (best.kind === 'similar' && kind === 'exact')) best = { legacyOption, kind }
        if (kind === 'exact') break
      }
      if (best) matchedLegacy.add(best.legacyOption)
      pairs.push({ option, best })
    }

    const overlap = pairs.filter((pair) => pair.best).length
    // Both sides expose the axis but describe different things (e.g. Chip.type is
    // leading content in Spinbox and a status colour in Legacy).
    const conflict = overlap === 0

    for (const { option, best } of pairs) {
      if (best) {
        rows.push({
          axis: axis.name,
          spinboxName: `${axis.name}=${option}`,
          legacyName: `${counterpart.name}=${best.legacyOption}`,
          confidence: best.kind,
          reviewReason:
            best.kind === 'similar'
              ? `Nombres distintos con el mismo significado aparente (\`${option}\` ↔ \`${best.legacyOption}\`). Confirmar con diseño.`
              : '',
          notes: axis.description,
        })
      } else {
        rows.push({
          axis: axis.name,
          spinboxName: `${axis.name}=${option}`,
          legacyName: NA,
          confidence: conflict ? 'conflict' : 'spinbox-only',
          reviewReason: conflict
            ? `\`${axis.name}\` existe en ambos pero los valores no se solapan: Spinbox [${axis.options.join(' | ')}] vs Legacy \`${counterpart.name}\` [${counterpart.options.join(' | ')}]. Son ejes distintos.`
            : `Sin valor equivalente en Legacy \`${counterpart.name}\` [${counterpart.options.join(' | ')}].`,
          notes: axis.description,
        })
      }
    }

    for (const legacyOption of counterpart.options) {
      if (matchedLegacy.has(legacyOption)) continue
      rows.push({
        axis: counterpart.name,
        spinboxName: NA,
        legacyName: `${counterpart.name}=${legacyOption}`,
        confidence: conflict ? 'conflict' : 'legacy-only',
        reviewReason: `Valor solo en Legacy. Spinbox \`${axis.name}\` ofrece [${axis.options.join(' | ')}].`,
        notes: counterpart.description,
      })
    }
  }

  for (const axis of legacyAxesList) {
    if (usedLegacyAxes.has(axis.name)) continue
    const reason = spinboxComponent
      ? `Spinbox \`${spinboxComponent.name}\` no declara un prop equivalente a \`${axis.name}\`.`
      : 'No hay componente Spinbox en components-props-spinbox.json.'
    for (const option of axis.options) {
      rows.push({
        axis: axis.name,
        spinboxName: NA,
        legacyName: `${axis.name}=${option}`,
        confidence: 'legacy-only',
        reviewReason: reason,
        notes: axis.description,
      })
    }
  }

  return { rows, spinboxAxes: spinboxAxesList.map((a) => a.name), legacyAxes: legacyAxesList.map((a) => a.name) }
}

/* ------------------------------------------------------------------ *
 * Prop pairing
 * ------------------------------------------------------------------ */

function findLegacyProp(spinboxName, legacyProps, used) {
  const available = legacyProps.filter((prop) => !used.has(prop.name))
  const byName = new Map(available.map((prop) => [prop.name, prop]))
  if (byName.has(spinboxName)) return { prop: byName.get(spinboxName), confidence: 'exact' }
  for (const alias of ALIASES[spinboxName] || []) {
    if (byName.has(alias)) return { prop: byName.get(alias), confidence: 'renamed' }
  }
  for (const [key, values] of Object.entries(ALIASES)) {
    if (values.includes(spinboxName) && byName.has(key)) {
      return { prop: byName.get(key), confidence: 'renamed' }
    }
  }
  return null
}

function buildPropMappings(spinboxProps, legacyProps, spinboxComponent, legacyComponent) {
  const used = new Set()
  const rows = []

  for (const prop of spinboxProps) {
    const match = findLegacyProp(prop.name, legacyProps, used)
    if (match) used.add(match.prop.name)

    let confidence = match ? match.confidence : 'spinbox-only'
    let reviewReason = ''

    if (match) {
      if (confidence === 'renamed') {
        reviewReason = `Emparejado por tabla de alias (\`${prop.name}\` → \`${match.prop.name}\`), no por nombre idéntico. Verificar.`
      }
      const spinboxType = shortType(prop.type)
      const legacyType = shortType(match.prop.type)
      if (spinboxType && legacyType && spinboxType !== legacyType) {
        const typeNote = `Tipos distintos: Spinbox \`${spinboxType}\` vs Legacy \`${legacyType}\`.`
        reviewReason = reviewReason ? `${reviewReason} ${typeNote}` : typeNote
        if (confidence === 'exact') confidence = 'similar'
      }
    } else {
      reviewReason = legacyComponent
        ? `Sin equivalente en Legacy \`${legacyComponent.name}\`. Resolver por composición o tokens.`
        : 'No hay componente Legacy en el JSON de parity.'
    }

    rows.push({
      spinboxProp: prop.name,
      legacyProp: match ? match.prop.name : NA,
      spinboxType: shortType(prop.type) || NA,
      legacyType: match ? shortType(match.prop.type) || NA : NA,
      confidence,
      reviewReason,
      spinboxDescription: prop.description || '',
      legacyDescription: match?.prop.description || '',
    })
  }

  for (const prop of legacyProps) {
    if (used.has(prop.name)) continue
    rows.push({
      spinboxProp: NA,
      legacyProp: prop.name,
      spinboxType: NA,
      legacyType: shortType(prop.type) || NA,
      confidence: 'legacy-only',
      reviewReason: spinboxComponent
        ? `Prop exclusiva de Legacy. Spinbox \`${spinboxComponent.name}\` no la declara: decidir si se cubre con tokens, slots o se descarta.`
        : 'No hay componente Spinbox en el JSON de Spinbox.',
      spinboxDescription: '',
      legacyDescription: prop.description || '',
    })
  }

  return rows
}

/* ------------------------------------------------------------------ *
 * Component pairs — Spinbox name is the key, Legacy comes from the parity JSON
 * ------------------------------------------------------------------ */

/**
 * Maps each row of the mapping document to its Spinbox component. The Legacy
 * counterpart is *not* hard-coded: it is resolved through the `spinboxComponent`
 * field that components-props-pagopop-parity.json already declares.
 */
const SEED_COMPONENTS = {
  'collapsible-accordion': { sb: 'Collapsible' },
  Callouts: { sb: 'Callout' },
  avatar: { sb: 'Avatar' },
  badge: { sb: 'Badge' },
  banner: { sb: 'Banner' },
  'bottom-sheet': { sb: 'BottomSheet' },
  button: { sb: 'Button' },
  card: { sb: 'BaseCard' },
  'carousel-indicator': { sb: 'CarouselIndicator' },
  checkbox: { sb: 'Checkbox' },
  chip: { sb: 'Chip' },
  divider: { sb: 'Divider' },
  dropdown: { sb: 'Dropdown', domain: true },
  'empty-state': { sb: 'EmptyState' },
  gradient: { sb: 'Gradient' },
  header: { sb: 'Header' },
  icon: { sb: 'Icon' },
  'icon-button': { sb: 'IconButton' },
  image: { sb: 'Image' },
  'text-input': { sb: 'TextInput', domain: true },
  'amount-input': { sb: 'AmountInput', domain: true },
  'token-input': { sb: 'TokenInput', domain: true },
  'list-item': { sb: 'ListItem' },
  loaders: { sb: 'ActivityLoader' },
  logo: { sb: 'Logo' },
  modal: { sb: 'Modal', domain: true },
  'progress-bar': { sb: 'ProgressBar' },
  'radio-button / Radio-box': { sb: 'RadioButton' },
  // Spinbox has no dedicated search bar: the mapping doc reuses TextInput.
  'search-bar': { sb: 'TextInput', lg: 'Input', domain: true },
  skeleton: { sb: 'Skeleton' },
  stepper: { sb: 'Stepper' },
  tabs: { sb: 'TabController' },
  'segmented-controller-tabs': { sb: 'SegmentedController' },
  tag: { sb: 'Tag' },
  'snackbar-toast': { sb: 'Snackbar' },
  'switch-toggle': { sb: 'Switch' },
  tooltip: { sb: 'Tooltip' },
  'vertical-card': { sb: 'VerticalCard' },
}

const spinboxByName = new Map(spinbox.components.map((component) => [component.name, component]))
const parityByName = new Map(parity.components.map((component) => [component.name, component]))
/** spinboxComponent → legacy component, as declared by the parity file itself. */
const parityBySpinbox = new Map()
for (const component of parity.components) {
  if (component.spinboxComponent && !parityBySpinbox.has(component.spinboxComponent)) {
    parityBySpinbox.set(component.spinboxComponent, component)
  }
}

/* ------------------------------------------------------------------ *
 * Audit
 * ------------------------------------------------------------------ */

function buildAudit(id, config, spinboxComponent, legacyComponent, propRows, variantRows, axes) {
  const issues = []

  if (!spinboxComponent) {
    issues.push({
      level: 'risk',
      title: 'Sin componente en Spinbox',
      detail: `\`${config.sb}\` no aparece en components-props-spinbox.json, así que no hay props ni variantes que comparar.`,
    })
  }
  if (!legacyComponent) {
    issues.push({
      level: 'risk',
      title: 'Sin componente en Legacy',
      detail:
        'Ningún componente de components-props-pagopop-parity.json apunta a este componente de Spinbox. Todo el lado Legacy queda en N/A.',
    })
  }

  // A component living under another component's folder is probably a private
  // sub-component, not the shared Legacy component the mapping doc means.
  if (legacyComponent?.source) {
    // `Foo/index.tsx` and `Foo/Foo.tsx` are top level; `Foo/Bar/index.tsx` is nested.
    const segments = legacyComponent.source.replace(/^src\/components\//, '').split('/')
    if (segments.length > 2) {
      issues.push({
        level: 'risk',
        title: 'Legacy apunta a un sub-componente',
        detail: `\`${legacyComponent.name}\` vive en \`${legacyComponent.source}\`, dentro de \`${segments[0]}\`. Es un componente privado de otro componente, no el componente compartido que asume el documento de mapeo.`,
      })
    }
  }

  if (variantRows.some((row) => row.confidence === 'conflict')) {
    issues.push({
      level: 'risk',
      title: 'Ejes de variante incompatibles',
      detail:
        'Ambos sistemas exponen el mismo prop pero con valores que no se solapan, así que el eje no significa lo mismo en cada lado.',
    })
  }

  if (spinboxComponent && legacyComponent && axes.spinboxAxes.length > 0 && axes.legacyAxes.length === 0) {
    issues.push({
      level: 'warn',
      title: 'Variantes de Legacy no verificables',
      detail: `Spinbox declara [${axes.spinboxAxes.join(', ')}] pero \`${legacyComponent.name}\` no expone ningún tipo enumerado. Las variantes de Legacy solo pueden confirmarse en Figma.`,
    })
  }

  if (spinboxComponent && legacyComponent && variantRows.length === 0) {
    issues.push({
      level: 'warn',
      title: 'Ningún eje de variante declarado',
      detail: 'Ninguno de los dos JSON declara colores, tamaños ni estados como tipos enumerados.',
    })
  }

  const pairedProps = propRows.filter(
    (row) => row.confidence === 'exact' || row.confidence === 'similar' || row.confidence === 'renamed',
  ).length
  if (spinboxComponent && legacyComponent && propRows.length > 0) {
    const ratio = pairedProps / propRows.length
    if (ratio < 0.35) {
      issues.push({
        level: 'warn',
        title: 'Cobertura de props baja',
        detail: `Solo ${pairedProps} de ${propRows.length} props se emparejan (${Math.round(ratio * 100)}%). El resto necesita composición, tokens o descartarse.`,
      })
    }
  }

  const renamed = propRows.filter((row) => row.confidence === 'renamed').length
  if (renamed > 0) {
    issues.push({
      level: 'warn',
      title: `${renamed} prop${renamed === 1 ? '' : 's'} emparejada${renamed === 1 ? '' : 's'} por alias`,
      detail:
        'Estos pares se infieren de una tabla de sinónimos, no de nombres idénticos en los JSON. Requieren confirmación manual.',
    })
  }

  const allRows = [...propRows, ...variantRows]
  const solid = allRows.filter((row) => row.confidence === 'exact' || row.confidence === 'similar').length
  const parityScore = allRows.length === 0 ? 0 : Math.round((solid / allRows.length) * 100)

  return {
    parity: parityScore,
    issues,
    spinboxComponent: spinboxComponent?.name ?? null,
    legacyComponent: legacyComponent?.name ?? null,
    legacySource: legacyComponent?.source ?? null,
    spinboxAxes: axes.spinboxAxes,
    legacyAxes: axes.legacyAxes,
  }
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

const result = {}

for (const [id, config] of Object.entries(SEED_COMPONENTS)) {
  const spinboxComponent = spinboxByName.get(config.sb) ?? null
  const legacyComponent = config.lg
    ? parityByName.get(config.lg) ?? null
    : parityBySpinbox.get(config.sb) ?? null

  const spinboxProps = componentProps(spinboxComponent, config.domain)
  const legacyProps = componentProps(legacyComponent, config.domain)

  const propRows = buildPropMappings(spinboxProps, legacyProps, spinboxComponent, legacyComponent)
  const { rows: variantRows, spinboxAxes, legacyAxes } = buildVariants(spinboxComponent, legacyComponent)
  const audit = buildAudit(id, config, spinboxComponent, legacyComponent, propRows, variantRows, {
    spinboxAxes,
    legacyAxes,
  })

  result[id] = { propMappings: propRows, variants: variantRows, audit }
}

/* ------------------------------------------------------------------ *
 * Emit
 * ------------------------------------------------------------------ */

const key = (id) => id.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()

let ts = `// Generated by scripts/generate-prop-mappings.mjs — do not edit by hand.
// Sources: docs/components-props-spinbox.json + docs/components-props-pagopop-parity.json
import type { ComponentAudit, PropMappingDraft, VariantDraft } from './types'

export interface GeneratedComponentData {
  propMappings: PropMappingDraft[]
  variants: VariantDraft[]
  audit: ComponentAudit
}

`

for (const [id, data] of Object.entries(result)) {
  const propDrafts = data.propMappings.map((row) => ({
    spinboxProp: row.spinboxProp,
    legacyProp: row.legacyProp,
    spinboxType: row.spinboxType,
    legacyType: row.legacyType,
    status: 'pending',
    notes: '',
    suggested: true,
    confidence: row.confidence,
    reviewReason: row.reviewReason || undefined,
    spinboxDescription: row.spinboxDescription || undefined,
    legacyDescription: row.legacyDescription || undefined,
  }))

  const variantDrafts = data.variants.map((row) => ({
    spinboxName: row.spinboxName,
    legacyName: row.legacyName,
    status: 'pending',
    notes: row.notes || '',
    suggested: true,
    axis: row.axis,
    confidence: row.confidence,
    reviewReason: row.reviewReason || undefined,
  }))

  ts += `const PROPS_${key(id)}: PropMappingDraft[] = ${JSON.stringify(propDrafts, null, 2)}\n\n`
  ts += `const VARIANTS_${key(id)}: VariantDraft[] = ${JSON.stringify(variantDrafts, null, 2)}\n\n`
  ts += `const AUDIT_${key(id)}: ComponentAudit = ${JSON.stringify(data.audit, null, 2)}\n\n`
}

ts += `export const GENERATED_DATA: Record<string, GeneratedComponentData> = {\n`
for (const id of Object.keys(result)) {
  ts += `  '${id}': { propMappings: PROPS_${key(id)}, variants: VARIANTS_${key(id)}, audit: AUDIT_${key(id)} },\n`
}
ts += `}\n`

fs.writeFileSync(path.join(root, 'src/data/generated-prop-mappings.ts'), ts)

/* ------------------------------------------------------------------ *
 * Console report
 * ------------------------------------------------------------------ */

console.log(`Spinbox components: ${spinbox.components.length} · Legacy (parity): ${parity.components.length}`)
console.log(`Mapped rows: ${Object.keys(result).length}\n`)

const pad = (value, width) => String(value).padEnd(width)
console.log(pad('ROW', 30) + pad('SPINBOX', 20) + pad('LEGACY', 22) + pad('PARITY', 8) + 'PROPS/VARS  RISKS')
for (const [id, data] of Object.entries(result)) {
  const risks = data.audit.issues.filter((issue) => issue.level === 'risk').length
  console.log(
    pad(id, 30) +
      pad(data.audit.spinboxComponent ?? NA, 20) +
      pad(data.audit.legacyComponent ?? NA, 22) +
      pad(`${data.audit.parity}%`, 8) +
      pad(`${data.propMappings.length}/${data.variants.length}`, 12) +
      (risks ? `⚠ ${risks}` : ''),
  )
}

const unmapped = parity.components.filter(
  (component) => !Object.values(SEED_COMPONENTS).some((cfg) => cfg.sb === component.spinboxComponent),
)
if (unmapped.length) {
  console.log(`\nLegacy components with no mapped row: ${unmapped.map((c) => c.name).join(', ')}`)
}
