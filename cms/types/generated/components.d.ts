import type { Schema, Struct } from '@strapi/strapi';

export interface SharedHeBrewsMenuItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_he_brews_menu_items';
  info: {
    displayName: 'He Brews Menu Item';
  };
  attributes: {
    drink: Schema.Attribute.String;
    heading: Schema.Attribute.Boolean;
    largeCost: Schema.Attribute.Decimal;
    notes: Schema.Attribute.Text;
    smallCost: Schema.Attribute.Decimal;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedPlainText extends Struct.ComponentSchema {
  collectionName: 'components_shared_plain_texts';
  info: {
    displayName: 'Plain text';
  };
  attributes: {
    Text: Schema.Attribute.Text;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedRow extends Struct.ComponentSchema {
  collectionName: 'components_shared_rows';
  info: {
    displayName: 'Row';
  };
  attributes: {
    body: Schema.Attribute.Text;
    img: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    style: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {};
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.he-brews-menu-item': SharedHeBrewsMenuItem;
      'shared.media': SharedMedia;
      'shared.plain-text': SharedPlainText;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.row': SharedRow;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
    }
  }
}
