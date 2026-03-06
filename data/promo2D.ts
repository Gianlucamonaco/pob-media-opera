import { Fonts, Layout2DType, OriginModes, Palette, Shape2DType, TextAligns } from "./constants";

export const promo = {

  promo: {
    elements: [
      {
        id: 'promo-1',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.5, y: 0.65 },
          spacing: { x: 0, y: 0 },
        },
        style: {
          color: Palette.WHITE,
          background: Palette.DARK,
          fontFamily: Fonts.MONO,
          fontSize: { px: 20 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
          textWrap: false,
          maxWidth: 0.208,
        },
        content: ["Physics of Beauty"]
      },
      {
        id: 'promo-2',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.5, y: 0.675 },
          spacing: { x: 0, y: 0 },
        },
        style: {
          color: Palette.WHITE,
          background: Palette.DARK,
          fontFamily: Fonts.MONO,
          fontSize: { px: 20 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
          textWrap: false,
          maxWidth: 0.208,
        },
        content: ["– a media opera"]
      },
      {
        id: 'promo-3',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.5, y: 0.725 },
          spacing: { x: 0, y: 0 },
        },
        style: {
          color: Palette.WHITE,
          background: Palette.DARK,
          fontFamily: Fonts.MONO,
          fontSize: { px: 20 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
          textWrap: false,
          maxWidth: 0.208,
        },
        content: ["25/03/2026"]
      },
      {
        id: 'promo-4',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.5, y: 0.775 },
          spacing: { x: 0, y: 0 },
        },
        style: {
          color: Palette.WHITE,
          background: Palette.DARK,
          fontFamily: Fonts.MONO,
          fontSize: { px: 20 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
          textWrap: false,
          maxWidth: 0.208,
        },
        content: ["Porgy&Bess, Vienna"]
      },
      {
        id: 'promo-5',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.5, y: 0.8 },
          spacing: { x: 0, y: 0 },
        },
        style: {
          color: Palette.WHITE,
          background: Palette.DARK,
          fontFamily: Fonts.MONO,
          fontSize: { px: 20 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
          textWrap: false,
          maxWidth: 0.208,
        },
        content: ["Vienna"]
      },

      {
        id: 'promo-6',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.5, y: 0.65 },
          spacing: { x: 0, y: 0 },
        },
        style: {
          color: Palette.WHITE,
          background: Palette.DARK,
          fontFamily: Fonts.MONO,
          fontSize: { px: 20 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
          textWrap: false,
          maxWidth: 0.208,
        },
        content: ["Clemens Wenger"]
      },
      {
        id: 'promo-7',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.5, y: 0.675 },
          spacing: { x: 0, y: 0 },
        },
        style: {
          color: Palette.WHITE,
          background: Palette.DARK,
          fontFamily: Fonts.MONO,
          fontSize: { px: 20 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
          textWrap: false,
          maxWidth: 0.208,
        },
        content: ["Jazzorchester Vorarlberg"]
      },
      {
        id: 'promo-8',
        shape: Shape2DType.TEXT,
        layout: {
          type: Layout2DType.GRID,
          dimensions: { x: 1, y: 1 },
          origin: { x: 0.5, y: 0.7 },
          spacing: { x: 0, y: 0 },
        },
        style: {
          color: Palette.WHITE,
          background: Palette.DARK,
          fontFamily: Fonts.MONO,
          fontSize: { px: 20 },
          originMode: OriginModes.CENTER,
          textAlign: TextAligns.CENTER,
          textWrap: false,
          maxWidth: 0.208,
        },
        content: ["Gianluca Monaco"]
      },
    ]
  }
}