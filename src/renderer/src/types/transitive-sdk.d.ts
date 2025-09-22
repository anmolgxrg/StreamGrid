declare module '@transitive-sdk/utils-web' {
  import React from 'react';

  interface TransitiveCapabilityProps {
    jwt?: string;
    control_rosVersion?: string;
    alwayson?: string;
    control_topic?: string;
    control_type?: string;
    count?: string;
    quantizer?: string;
    rosversion?: string;
    rosversion_1?: string;
    rosversion_2?: string;
    rosversion_3?: string;
    rosversion_4?: string;
    rosversion_5?: string;
    source?: string;
    source_1?: string;
    source_2?: string;
    source_3?: string;
    source_4?: string;
    source_5?: string;
    timeout?: string;
    type?: string;
    type_1?: string;
    type_2?: string;
    type_3?: string;
    type_4?: string;
    type_5?: string;
    [key: string]: any;
  }

  export const TransitiveCapability: React.FC<TransitiveCapabilityProps>;
}
