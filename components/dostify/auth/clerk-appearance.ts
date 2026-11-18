import { BRAND } from "@/lib/dostify/brand";

const FIELD_BORDER = "#D9CBC2";
const FIELD_EDGE = `1px solid ${FIELD_BORDER}`;

/* Clerk's form, restyled to sit on the paper side of AuthShell. AuthShell
   draws its own heading, so Clerk's header is hidden. Layout overrides are
   style objects: they merge into Clerk's own styles and beat its fixed card
   width, which className overrides do not reliably do. */
export const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
    logoPlacement: "none" as const,
  },
  variables: {
    colorPrimary: BRAND.coral,
    colorPrimaryForeground: "#FFFFFF",
    colorForeground: BRAND.ink,
    colorMutedForeground: BRAND.slate,
    colorBackground: BRAND.paper,
    colorInput: "#FFFFFF",
    colorInputForeground: BRAND.ink,
    // Form controls need a firmer edge than page dividers on a light page.
    colorBorder: FIELD_BORDER,
    colorRing: BRAND.coral,
    colorDanger: "#B42318",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-sans), system-ui, sans-serif",
    fontSize: "15px",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: { width: "100%", display: "flex", justifyContent: "center", marginInline: "auto" },
    cardBox: {
      width: "100%",
      maxWidth: "none",
      boxShadow: "none",
      border: "none",
      borderRadius: 0,
      background: "transparent",
      overflow: "visible",
    },
    card: {
      width: "100%",
      padding: 0,
      gap: "1.75rem",
      boxShadow: "none",
      border: "none",
      background: "transparent",
      overflow: "visible",
    },
    header: { display: "none" },
    main: { gap: "1.5rem" },
    socialButtonsBlockButton: {
      height: "2.75rem",
      borderRadius: "9999px",
      background: "#FFFFFF",
      border: FIELD_EDGE,
      boxShadow: "none",
    },
    dividerLine: { background: BRAND.rule },
    formFieldLabel: { fontSize: "14px", fontWeight: 500 },
    formFieldInput: {
      height: "2.75rem",
      border: FIELD_EDGE,
      boxShadow: "none",
      "&:focus": { borderColor: BRAND.coral, boxShadow: "0 0 0 3px rgba(217,83,43,0.18)" },
    },
    formButtonPrimary: {
      height: "2.75rem",
      borderRadius: "9999px",
      boxShadow: "none",
      fontSize: "15px",
      fontWeight: 600,
      textTransform: "none" as const,
      background: BRAND.coral,
      "&:hover": { background: BRAND.coralDeep },
      "&::after": { display: "none" },
    },
    buttonArrowIcon: { display: "none" },
    footer: {
      background: "transparent",
      border: "none",
      "& > div": { paddingLeft: 0, paddingRight: 0 },
    },
    footerAction: { justifyContent: "center" },
    footerActionLink: {
      color: BRAND.coralDeep,
      fontWeight: 600,
      textDecoration: "underline",
      textUnderlineOffset: "4px",
      textDecorationColor: BRAND.coralSoft,
    },
  },
};
