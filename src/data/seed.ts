import { GENERATED_DATA } from './generated-prop-mappings'
import type {
  ComponentAudit,
  ComponentMapping,
  MappingDataset,
  MatchStatus,
  PropMapping,
  Source,
  VariantMapping,
} from './types'

const SPINBOX_ROOT = 'https://spinbox.tools.genesysprime.mx/mobile/components'
const LEGACY_FILE = 'https://www.figma.com/design/1NqMpfpvxnhpOf11Bod4Xz/Design-system-Spin'

function spinbox(label: string, path: string, note?: string): Source {
  return { label, url: `${SPINBOX_ROOT}/${path}`, kind: 'spinbox-docs', note }
}

function missing(label: string, note: string): Source {
  return { label, url: null, kind: 'none', note }
}

function legacy(label: string, nodeId: string, note?: string): Source {
  return { label, url: `${LEGACY_FILE}?node-id=${nodeId}`, kind: 'figma', note }
}

/** Legacy component that exists in pagopop-mobile but has no Figma node in the mapping doc. */
function legacyCode(label: string, note: string): Source {
  return { label, url: null, kind: 'none', note }
}

interface Draft {
  id: string
  title: string
  category: string
  match: MatchStatus
  spinbox: Source
  legacy: Source
  notes?: string
  /**
   * Only for rows that no JSON describes. Everything with generated data takes
   * its props and variants from the two JSON files instead.
   */
  variants?: Omit<VariantMapping, 'id'>[]
  propMappings?: Omit<PropMapping, 'id'>[]
}

/**
 * One row per entry of the mapping document, plus the pairs that only
 * components-props-pagopop-parity.json revealed (Badge, Divider, IconButton…).
 *
 * `match` reflects what the two JSON files can actually prove — several rows were
 * downgraded from "Direct match" because the variant axes do not line up.
 */
const drafts: Draft[] = [
  {
    id: 'collapsible-accordion',
    title: 'Collapsible / Accordion',
    category: 'Data display',
    match: 'approximate',
    spinbox: spinbox('Collapsible', 'data-display/collapsible/'),
    legacy: legacy('Accordion', '8247-133883'),
    notes:
      'Spinbox lo llama Collapsible y el documento de mapeo etiqueta el lado de Spinbox como "Accordion": hay que acordar un nombre antes de migrar. Ninguno de los dos JSON declara variantes enumeradas, así que los estados visuales solo pueden confirmarse en Figma.',
  },
  {
    id: 'Callouts',
    title: 'Callouts',
    category: 'System feedback',
    match: 'exact',
    spinbox: spinbox('Callout', 'system-feedback/callout/'),
    legacy: legacyCode(
      'MessageNotice',
      'Existe en pagopop-mobile (src/components/MessageNotice), pero el documento de mapeo no le asignó un nodo de Figma.',
    ),
    notes:
      'Corregido: el seed anterior afirmaba que Legacy no tenía un Callout. MessageNotice sí existe y sus cinco severidades cuadran una a una con las de Spinbox (error, success, warning exactos; informational ↔ info y points ↔ premia por nombre distinto).',
  },
  {
    id: 'avatar',
    title: 'Avatar',
    category: 'Data display',
    match: 'needs-review',
    spinbox: spinbox('Avatar', 'data-display/avatar'),
    legacy: legacy('UserAvatar', '6306-256'),
    notes:
      'UserAvatar no declara ningún tipo enumerado, así que las tallas de avatar (24/32/40/44/56/80 que aparecían en el seed anterior) no están respaldadas por ningún JSON. Spinbox solo enumera shape=circled | squared.',
  },
  {
    id: 'badge',
    title: 'Badge',
    category: 'Tagging & categorization',
    match: 'needs-review',
    spinbox: spinbox('Badge', 'tagging-categorization/badge/'),
    legacy: legacyCode(
      'Badge',
      'Existe en pagopop-mobile (src/components/Badge) con una sola prop; no aparece en el documento de mapeo.',
    ),
    notes:
      'Fila nueva descubierta en el JSON de parity. Spinbox expone 21 valores enumerados (tamaño, posición del símbolo y tokens de color) frente a una única prop en Legacy: la superficie es incomparable tal como está.',
  },
  {
    id: 'banner',
    title: 'Banner',
    category: 'Data display',
    match: 'approximate',
    spinbox: spinbox('Banner', 'data-display/banner/'),
    legacy: legacy('TopBanner', '6753-110818'),
    notes:
      'Corregido: el seed anterior no tenía contraparte de código para Banner. TopBanner existe en pagopop-mobile, pero ninguno de los dos componentes declara variantes enumeradas, así que las severidades info/success/warning/error del seed anterior eran inventadas.',
  },
  {
    id: 'bottom-sheet',
    title: 'Bottom sheet',
    category: 'Modals',
    match: 'approximate',
    spinbox: spinbox('BottomSheet', 'modals/bottomsheet/'),
    legacy: legacyCode(
      'BottomModal',
      'Existe en pagopop-mobile (src/components/BottomModal); no aparece en el documento de mapeo.',
    ),
    notes:
      'Fila nueva descubierta en el JSON de parity. Spinbox expone themeVariant=default | cowkid, que Legacy no tiene.',
  },
  {
    id: 'button',
    title: 'Button',
    category: 'Buttons',
    match: 'approximate',
    spinbox: spinbox('Button', 'buttons/button/'),
    legacy: legacy('Button', '6092-18262'),
    notes:
      'Las cuatro variantes de Spinbox cuadran con las de Legacy por sinónimo (filled ↔ solid, outlined ↔ outline, clean ↔ clear, outlined-destructive ↔ delete), pero Legacy añade type=light sin equivalente y las tallas no coinciden: Spinbox tiene small | medium y Legacy large | small | none. Los cinco outlinedColor de Spinbox no existen en Legacy.',
  },
  {
    id: 'card',
    title: 'Card (Custom Component from Spinbox Legacy)',
    category: 'Cards',
    match: 'approximate',
    spinbox: spinbox('BaseCard (compound component)', 'cards/basecard/'),
    legacy: legacy('CustomCard', '14370-4802'),
    notes:
      'Spinbox entrega un componente compuesto (BaseCard + slots) y Legacy tiene variantes planas de tarjeta. Cada variante de Legacy debe expresarse como una composición de BaseCard; ningún JSON enumera esas variantes.',
  },
  {
    id: 'carousel-indicator',
    title: 'Carousel indicator',
    category: 'Navigation',
    match: 'missing-legacy',
    spinbox: spinbox('CarouselIndicator', 'navigation/carouselindicator/'),
    legacy: legacy('Carousel Indicator', '6092-18195'),
    notes:
      'Corregido: no hay ningún componente de pagopop-mobile que apunte a CarouselIndicator, así que el lado de Legacy solo existe en Figma. Spinbox enumera variant=neutral | color y position=left | center, no los dots/bars del seed anterior.',
  },
  {
    id: 'checkbox',
    title: 'Checkbox',
    category: 'Controls',
    match: 'approximate',
    spinbox: spinbox('Checkbox', 'controls/checkbox/'),
    legacy: legacy('RadioCheckbox', '6429-12'),
    notes:
      'RadioCheckbox arrastra la API de @rneui/themed, de ahí la cantidad de props exclusivas de Legacy. Ninguno de los dos lados declara variantes enumeradas: checked/error/disabled son booleanos, no un eje de variante.',
  },
  {
    id: 'chip',
    title: 'Chip',
    category: 'Tagging & categorization',
    match: 'needs-review',
    spinbox: spinbox('Chip', 'tagging-categorization/chip/'),
    legacy: legacy('Chip', '6924-113330'),
    notes:
      'Conflicto real: ambos exponen `type` pero significan cosas distintas. En Spinbox type=image | logo | icon describe el contenido inicial; en Legacy type=success | error | pending | info describe un color de estado. No es un mapeo 1:1 y hay que decidir qué eje sobrevive.',
  },
  {
    id: 'confirmation-behaviours',
    title: 'Confirmation behaviours',
    category: 'Templates',
    match: 'missing-spinbox',
    spinbox: missing(
      'No disponible',
      'No existe un componente en Spinbox. El documento de mapeo indica que esto debería ser una plantilla en lugar de un componente.',
    ),
    legacy: legacy('Confirmation Behaviours', '4807-125280'),
    notes: 'Decidir si esto se entrega como una plantilla de Spinbox, una receta de pantalla o solo documentación.',
  },
  {
    id: 'debit-card',
    title: 'Debit card (Custom Component from Spinbox Legacy)',
    category: 'Cards',
    match: 'missing-spinbox',
    spinbox: missing('No disponible', 'No existe en Spinbox ("No existe").'),
    legacy: legacy('Debit Card', '7026-113444'),
  },
  {
    id: 'divider',
    title: 'Divider',
    category: 'Data display',
    match: 'approximate',
    spinbox: spinbox('Divider', 'data-display/divider/'),
    legacy: legacyCode(
      'Divider',
      'Existe en pagopop-mobile (src/components/Divider); no aparece en el documento de mapeo.',
    ),
    notes:
      'Fila nueva descubierta en el JSON de parity. Spinbox tokeniza el color (stroke_primary | stroke_secondary); Legacy no.',
  },
  {
    id: 'dropdown',
    title: 'Dropdown',
    category: 'Inputs',
    match: 'needs-review',
    spinbox: spinbox('Dropdown', 'inputs/dropdown/'),
    legacy: legacy('InputWrapper', '6652-107618'),
    notes:
      'Dropdown de Spinbox hereda las primitivas de TextInput, mientras que InputWrapper tiene una UX más especializada de búsqueda y selección. La estructura visual es parecida, pero los hooks de interacción no son 1:1.',
  },
  {
    id: 'empty-state',
    title: 'Empty state',
    category: 'System feedback',
    match: 'approximate',
    spinbox: spinbox('EmptyState', 'system-feedback/emptystate/'),
    legacy: legacyCode(
      'EmptyStateWithAction',
      'Existe en pagopop-mobile (src/components/EmptyStateWithAction); no aparece en el documento de mapeo.',
    ),
    notes:
      'Fila nueva descubierta en el JSON de parity. Spinbox enumera variant=contained | fullscreen, que Legacy no declara.',
  },
  {
    id: 'footer',
    title: 'Footer',
    category: 'Navigation',
    match: 'missing-spinbox',
    spinbox: missing('No disponible', 'No existe un componente Footer en Spinbox ("no existe footer").'),
    legacy: legacy('Footer', '2058-788'),
  },
  {
    id: 'gradient',
    title: 'Gradient',
    category: 'Data display',
    match: 'approximate',
    spinbox: spinbox('Gradient', 'data-display/gradient/'),
    legacy: legacyCode(
      'LinearGradient',
      'Existe en pagopop-mobile (src/components/LinearGradient); no aparece en el documento de mapeo.',
    ),
    notes: 'Fila nueva descubierta en el JSON de parity. Es el par con mejor cobertura de props sin variantes.',
  },
  {
    id: 'header',
    title: 'Header',
    category: 'Navigation',
    match: 'exact',
    spinbox: spinbox('Header', 'navigation/header/?_highlight=header'),
    legacy: legacy('Header', '6108-189'),
    notes:
      'El único par con paridad total en los dos JSON: mismos nombres de props y variant=main | secondary idéntico en ambos lados.',
  },
  {
    id: 'icon',
    title: 'Icon',
    category: 'Data display',
    match: 'needs-review',
    spinbox: spinbox('Icon', 'data-display/icon/?_highlight=icons'),
    legacy: legacy('Icon', '6019-74691'),
    notes:
      'Corregido: ningún componente de pagopop-mobile apunta a Icon, así que el lado de Legacy solo existe en Figma. El color, el tamaño y el strokeWidth que el seed anterior enumeraba no son uniones enumeradas en Spinbox — `name` sí lo es, con 296 iconos.',
  },
  {
    id: 'icon-button',
    title: 'Icon button',
    category: 'Buttons',
    match: 'exact',
    spinbox: spinbox('IconButton', 'buttons/iconbutton/'),
    legacy: legacyCode(
      'ActionBoxButton',
      'Existe en pagopop-mobile (src/components/ActionBoxButton); no aparece en el documento de mapeo.',
    ),
    notes:
      'Fila nueva descubierta en el JSON de parity, y el par mejor alineado después de Header: variant=filled | tonal | outlined | clean y size=extra-small | small | medium son idénticos en ambos lados. Conviene comprobar si ActionBoxButton ya envuelve al IconButton de Spinbox.',
  },
  {
    id: 'image',
    title: 'Image',
    category: 'Data display',
    match: 'approximate',
    spinbox: spinbox('Image', 'data-display/image/'),
    legacy: legacyCode(
      'RemoteImage',
      'Existe en pagopop-mobile (src/components/RemoteImage); no aparece en el documento de mapeo.',
    ),
    notes: 'Fila nueva descubierta en el JSON de parity. Ninguno de los dos lados declara variantes enumeradas.',
  },
  {
    id: 'text-input',
    title: 'Text input / Input fields',
    category: 'Inputs',
    match: 'approximate',
    spinbox: spinbox('TextInput', 'inputs/textinput/'),
    legacy: legacy('Input', '6108-748'),
    notes:
      'Spinbox enumera variant=text | password | date | card-number | text-area; Legacy Input no declara ninguna unión equivalente. Ojo: el `status=default | error | success` que el seed anterior atribuía a TextInput solo existe en TokenInput.',
  },
  {
    id: 'amount-input',
    title: 'Amount input / Amounts',
    category: 'Inputs',
    match: 'approximate',
    spinbox: spinbox('AmountInput', 'inputs/amountinput/'),
    legacy: legacy('DecimalInput', '6645-110461'),
    notes:
      'DecimalInput no declara variantes enumeradas: los estados empty/filled/error/disabled del seed anterior son booleanos sueltos, no un eje de variante.',
  },
  {
    id: 'token-input',
    title: 'Token input / Passcode & OTP',
    category: 'Inputs',
    match: 'approximate',
    spinbox: spinbox('TokenInput', 'inputs/tokeninput/'),
    legacy: legacy('PinCodeInput', '6113-4225'),
    notes:
      'Legacy separa passcode, OTP y NIP; comprobar si un solo TokenInput de Spinbox cubre los tres casos. Spinbox es el único lado que declara status=default | error | success.',
  },
  {
    id: 'text-area',
    title: 'Text area',
    category: 'Inputs',
    match: 'missing-spinbox',
    spinbox: missing(
      'No disponible',
      'No existe un Text area dedicado en Spinbox; se cubre con TextInput variant=text-area.',
    ),
    legacy: legacy('Text Area', '6647-110596'),
  },
  {
    id: 'instructions',
    title: 'Instructions',
    category: 'Data display',
    match: 'missing-spinbox',
    spinbox: missing('No disponible', 'No existe un componente de instrucciones en Spinbox.'),
    legacy: legacy('Instructions', '6422-43'),
  },
  {
    id: 'list-item',
    title: 'List item / Lists',
    category: 'Data display',
    match: 'needs-review',
    spinbox: spinbox('ListItem', 'data-display/listitem/'),
    legacy: legacy('Lists', '6371-0'),
    notes:
      'El ListItem de Spinbox es un componente slotizado con 31 valores enumerados (behavior, controlType, graphicType, tags, badges…). El ListItem de Legacy no declara ninguno, así que la práctica totalidad del eje de variantes queda sin verificar.',
  },
  {
    id: 'loaders',
    title: 'Activity loader / Loaders',
    category: 'Loaders',
    match: 'needs-review',
    spinbox: {
      label: 'ActivityLoader + Skeleton',
      url: `${SPINBOX_ROOT}/loaders/activityloader/`,
      kind: 'spinbox-docs',
      note: 'Dos componentes de Spinbox cubren una sola página de Legacy.',
      extra: [{ label: 'Skeleton', url: `${SPINBOX_ROOT}/loaders/skeleton/` }],
    },
    legacy: legacy('Loaders', '8097-128541'),
    notes:
      'Corregido: ningún componente de pagopop-mobile apunta a ActivityLoader (SpinSkeleton apunta a Skeleton, que ya tiene su propia fila). Spinbox enumera color=brand | neutral | inverted y size=small | medium | large, sin contraparte verificable.',
  },
  {
    id: 'logo',
    title: 'Logo',
    category: 'Data display',
    match: 'approximate',
    spinbox: spinbox('Logo', 'data-display/logo/'),
    legacy: legacyCode('Logo', 'Existe en pagopop-mobile (src/components/Logo); no aparece en el documento de mapeo.'),
    notes:
      'Fila nueva descubierta en el JSON de parity. Spinbox enumera name=amex | mastercard | visa | edenred; Legacy expone solo dos props.',
  },
  {
    id: 'modal',
    title: 'Modal',
    category: 'Modals',
    match: 'approximate',
    spinbox: spinbox('Modal', 'modals/modal/'),
    legacy: legacy('CustomModal', '4936-68169'),
    notes:
      'Spinbox enumera variant=default | one-button | two-button | content | customized. CustomModal no declara ninguna unión, así que las variantes alert/bottom-sheet/fullscreen/with-illustration del seed anterior no están respaldadas por ningún JSON.',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    category: 'System feedback',
    match: 'missing-spinbox',
    spinbox: missing('No disponible', 'No existe un componente Notification en Spinbox.'),
    legacy: legacy('Notifications', '6402-102350'),
    notes: 'Snackbar también mapea a Toast Notification, así que uno de los dos componentes de Legacy sigue sin hogar.',
  },
  {
    id: 'ocr',
    title: 'OCR',
    category: 'Templates',
    match: 'missing-spinbox',
    spinbox: missing('No disponible', 'No existe en Spinbox ("No existe").'),
    legacy: legacy('OCR', '6402-102621'),
  },
  {
    id: 'paragraphs-texts',
    title: 'Paragraphs / Texts',
    category: 'Typography',
    match: 'missing-spinbox',
    spinbox: missing(
      'No disponible',
      'No existe un componente de Paragraphs/Texts en Spinbox ("No existe"). La tipografía puede estar cubierta por tokens en su lugar.',
    ),
    legacy: legacy('Paragraphs / Texts', '2585-30857'),
  },
  {
    id: 'progress-bar',
    title: 'Progress bar',
    category: 'System feedback',
    match: 'missing-legacy',
    spinbox: spinbox('ProgressBar', 'system-feedback/progressbar/'),
    legacy: legacy('Progress Bar', '6706-111076'),
    notes:
      'Corregido: ningún componente de pagopop-mobile apunta a ProgressBar, así que el lado de Legacy solo existe en Figma. Spinbox sí enumera los nueve tokens de color, size=medium | large y textIndicator=steps | percentage.',
  },
  {
    id: 'punch-card',
    title: 'Punch card (Custom Component from Spinbox Legacy)',
    category: 'Cards',
    match: 'missing-spinbox',
    spinbox: missing('No disponible', 'No existe un componente Punch Card en Spinbox ("No existe").'),
    legacy: legacy('Punch Card', '16474-8530'),
  },
  {
    id: 'vertical-card',
    title: 'Vertical card',
    category: 'Cards',
    match: 'missing-legacy',
    spinbox: spinbox('VerticalCard', 'cards/verticalcard/'),
    legacy: missing('No disponible', 'No existe un Vertical Card en Spin legacy ni en el JSON de parity.'),
    notes:
      'Spinbox enumera imageVariant=contained | full, imageSize=small | large y bodySize=small | medium. No hay nada con lo que compararlos.',
  },
  {
    id: 'radio-button / Radio-box',
    title: 'Radio button',
    category: 'Controls',
    match: 'needs-review',
    spinbox: spinbox('RadioButton', 'controls/radiobutton/'),
    legacy: legacy('RadioBox', '5677-154'),
    notes:
      'RadioBox agrupa las opciones en una prop `option`, mientras que el RadioButton de Spinbox es un control individual. Ninguno de los dos declara variantes enumeradas.',
  },
  {
    id: 'search-bar',
    title: 'Search bar',
    category: 'Inputs',
    match: 'approximate',
    spinbox: spinbox(
      'TextInput (used as search)',
      'inputs/textinput',
      'Spinbox no tiene un Search Bar dedicado; el documento de mapeo reutiliza TextInput.',
    ),
    legacy: legacy('Search Bar', '6120-634'),
    notes:
      'Mapeo por composición: comparte exactamente la misma API que la fila de Text input, porque los dos lados son TextInput y el Input de Legacy. Los estados empty/typing/filled no son props enumeradas en ningún JSON.',
  },
  {
    id: 'skeleton',
    title: 'Skeleton',
    category: 'Loaders',
    match: 'approximate',
    spinbox: {
      label: 'Skeleton',
      url: `${SPINBOX_ROOT}/loaders/skeleton/`,
      kind: 'spinbox-docs',
    },
    legacy: legacyCode(
      'SpinSkeleton',
      'Existe en pagopop-mobile (src/components/SpinSkeleton); no aparece en el documento de mapeo.',
    ),
    notes:
      'Corregido: el seed anterior lo marcaba como inexistente en Legacy y le copiaba las variantes de ActivityLoader. SpinSkeleton sí existe; Spinbox enumera variant=square | round | circle | text-large | text-small.',
  },
  {
    id: 'stepper',
    title: 'Stepper / Vertical stepper timeline',
    category: 'System feedback',
    match: 'approximate',
    spinbox: spinbox('Stepper', 'system-feedback/stepper/'),
    legacy: legacy('Stepper', '6232-99078'),
    notes:
      'Spinbox solo enumera indicators=numeric | simple | icon-all-steps | icon-active. Los tokens de color y el eje horizontal/vertical del seed anterior no existen en ninguno de los dos JSON; el Stepper de Legacy expone tres props.',
  },
  {
    id: 'tabs',
    title: 'Tab controller / Tabs',
    category: 'Navigation',
    match: 'needs-review',
    spinbox: spinbox('TabController', 'navigation/tabcontroller/'),
    legacy: legacy('TextTab', '6920-114064'),
    notes:
      'Ni TabController ni TextTab declaran variantes enumeradas, así que fixed/scrollable/with-icons/with-badge del seed anterior no tienen respaldo. Además esta fila y Segmented controller apuntan al mismo nodo de Figma.',
  },
  {
    id: 'segmented-controller-tabs',
    title: 'Segmented Controller / Tabs',
    category: 'Navigation',
    match: 'missing-legacy',
    spinbox: spinbox('SegmentedController', 'navigation/segmentedcontroller/'),
    legacy: legacy('Tabs', '6920-114064'),
    notes:
      'Corregido: ningún componente de pagopop-mobile apunta a SegmentedController. Comparte el nodo de Figma con la fila de Tabs, que sí tiene contraparte de código (TextTab): hay que resolver el doble mapeo.',
  },
  {
    id: 'tag',
    title: 'Tag',
    category: 'Tagging & categorization',
    match: 'needs-review',
    spinbox: spinbox('Tag', 'tagging-categorization/tag/'),
    legacy: legacy('Tag', '6924-113075'),
    notes:
      'Dos problemas. El Tag de Legacy no es un componente compartido: vive en src/components/ActionBoxButton/Tag, dentro de otro componente. Y solo expone color=urgent_content | success_content, frente a las ocho variantes de Spinbox — que además no incluyen `success`, pese a que el seed anterior lo daba por mapeado.',
  },
  {
    id: 'tables',
    title: 'Tables',
    category: 'Data display',
    match: 'missing-spinbox',
    spinbox: missing('No disponible', 'No existen tables en Spinbox ("No hay tables").'),
    legacy: legacy('Tables', '6236-100570'),
  },
  {
    id: 'snackbar-toast',
    title: 'Snackbar / Toast notification',
    category: 'System feedback',
    match: 'approximate',
    spinbox: spinbox('Snackbar', 'system-feedback/snackbar/'),
    legacy: legacy('Snackbar', '6113-4682'),
    notes:
      'El mismo componente de Spinbox también se propone para Legacy Notifications; hay que resolver el doble mapeo. Ninguno de los dos lados enumera severidades: las de informative/success/error del seed anterior eran inventadas.',
  },
  {
    id: 'switch-toggle',
    title: 'Switch / Toggle',
    category: 'Controls',
    match: 'approximate',
    spinbox: spinbox('Switch', 'controls/switch/'),
    legacy: legacy('CustomSwitch', '6236-98901'),
    notes:
      'Corregido: el seed anterior no tenía contraparte de código. CustomSwitch existe en pagopop-mobile. El modelo de interacción encaja (valor, callback, disabled) y las diferencias son de estilo, que en Spinbox se resuelven con tokens del theme.',
  },
  {
    id: 'tooltip',
    title: 'Tooltip',
    category: 'Modals',
    match: 'needs-review',
    spinbox: spinbox('Tooltip', 'modals/tooltip/'),
    legacy: legacy('Tooltip', '6226-566'),
    notes:
      'Los dos se llaman Tooltip pero casi no comparten props, y ninguno declara variantes enumeradas: las posiciones top/bottom/left/right y los temas dark/light del seed anterior no están en ningún JSON.',
  },
]

/** Rows that no JSON describes: everything stays N/A and the gap is made explicit. */
function auditWithoutEvidence(draft: Draft): ComponentAudit {
  const hasSpinbox = draft.spinbox.kind === 'spinbox-docs'
  return {
    parity: 0,
    issues: [
      {
        level: 'risk',
        title: 'Sin evidencia en los JSON',
        detail: hasSpinbox
          ? 'Este componente de Spinbox no está incluido en el análisis de props, así que no hay nada que comparar: props y variantes quedan en N/A.'
          : 'Ni components-props-spinbox.json ni components-props-pagopop-parity.json describen esta fila. Solo existe como nodo de Figma, así que props y variantes quedan en N/A.',
      },
    ],
    spinboxComponent: null,
    legacyComponent: null,
    legacySource: null,
    spinboxAxes: [],
    legacyAxes: [],
  }
}

const components: ComponentMapping[] = drafts.map((draft) => {
  const generated = GENERATED_DATA[draft.id]
  const propSource = generated?.propMappings ?? draft.propMappings ?? []
  const variantSource = generated?.variants ?? draft.variants ?? []

  return {
    id: draft.id,
    title: draft.title,
    category: draft.category,
    match: draft.match,
    spinbox: draft.spinbox,
    legacy: draft.legacy,
    notes: draft.notes ?? '',
    audit: generated?.audit ?? auditWithoutEvidence(draft),
    propMappings: propSource.map((mapping, index) => ({
      ...mapping,
      id: `${draft.id}-p${index + 1}`,
    })),
    variants: variantSource.map((variant, index) => ({
      ...variant,
      id: `${draft.id}-v${index + 1}`,
    })),
  }
})

export const SEED_DATASET: MappingDataset = {
  revision: 4,
  updatedAt: '2026-08-27',
  components,
}

export const SEED_SOURCE_DOC =
  'components-props-spinbox.json + components-props-pagopop-parity.json (Spin box - Mapeo, PDF 8 páginas)'
