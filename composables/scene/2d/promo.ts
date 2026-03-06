export const scene2DPromo = {

  promo: {
    init: (engine: any) => {
      const promo = [
        engine.elements.get('promo-1'), 
        engine.elements.get('promo-2'), 
        engine.elements.get('promo-3'), 
        engine.elements.get('promo-4'), 
        engine.elements.get('promo-5'), 
        engine.elements.get('promo-6'), 
        engine.elements.get('promo-7'), 
        engine.elements.get('promo-8')
      ];

      promo.forEach(el => {
        if (!el?.data[0]) return;

        // Set visibility false
        el.data[0].visibility = false;
      })
    },
    update: (engine: any) => {

      const promo = [
        engine.elements.get('promo-1'), 
        engine.elements.get('promo-2'), 
        engine.elements.get('promo-3'), 
        engine.elements.get('promo-4'), 
        engine.elements.get('promo-5'), 
        engine.elements.get('promo-6'), 
        engine.elements.get('promo-7'), 
        engine.elements.get('promo-8')
      ];

      promo.forEach((el, i) => {
        let text = el?.data[0];
        if (!text) return;

        if (usePromoTextIndex().value <= 0) text.visibility = false;

        else if (usePromoTextIndex().value >= 5) {
          if (i >= 5 && i < usePromoTextIndex().value && !text.visibility) text.visibility = true;
          else if (i < 5 && text.visibility) text.visibility = false;
        }

        else if (usePromoTextIndex().value < 6 && i < usePromoTextIndex().value && !text.visibility) text.visibility = true;
      })
    },
  },
}