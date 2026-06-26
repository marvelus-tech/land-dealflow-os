# Dallas Owner Contact Manual Lookup Sprint

Purpose: rapidly convert public owner rows into scored contact candidates for verification-first seller calls. No fabricated phone/email. Do not bulk scrape people-search sites or bypass blocks/captchas.

## Paste-back format

```csv
parcelId,ownerName,candidatePhone,candidateEmail,contactConfidence,contactSource,matchBasis
```

## First 12 lookup rows

### 1. HOLMAN LORIA ANN — 3243 MODELLA AVE, DALLAS, TX 75229
- Priority: `A-owner-occupant-first`
- Parcel: `00000594277000000`
- Mailing: 3243 MODELLA AVE DALLAS TEXAS 752292516
- TPS name/city: https://www.truepeoplesearch.com/results?name=LORIA+HOLMAN&citystatezip=Dallas%2C+TX
- TPS address: https://www.truepeoplesearch.com/resultaddress?streetaddress=3243+MODELLA+AVE+DALLAS+TEXAS+752292516&citystatezip=Dallas%2C+TX
- Match must-have: name match + Dallas/TX or address-history overlap with mailing/property address
- Paste back: `00000594277000000,HOLMAN LORIA ANN,<candidatePhone>,<candidateEmail>,<0-100>,manual lookup,<match basis>`
- Opener: Hi, is this HOLMAN LORIA ANN? I’m calling about the property at/near 3243 MODELLA AVE. I work with builders looking for land deals in Dallas, and your property may fit what they buy. I’m not calling to pressure you — I’m checking whether selling is something you’d consider if the terms made sense.

### 2. BURANI ROHIT M & — 11652 CORAL HILLS CT, DALLAS, TX 75229
- Priority: `A-owner-occupant-first`
- Parcel: `00000594130000000`
- Mailing: CHETNA A MANGHNANI 11652 CORAL HILLS CT DALLAS TEXAS 752292501
- TPS name/city: https://www.truepeoplesearch.com/results?name=ROHIT+BURANI&citystatezip=Dallas%2C+TX
- TPS address: https://www.truepeoplesearch.com/resultaddress?streetaddress=CHETNA+A+MANGHNANI+11652+CORAL+HILLS+CT+DALLAS+TEXAS+752292501&citystatezip=Dallas%2C+TX
- Match must-have: name match + Dallas/TX or address-history overlap with mailing/property address
- Paste back: `00000594130000000,BURANI ROHIT M &,<candidatePhone>,<candidateEmail>,<0-100>,manual lookup,<match basis>`
- Opener: Hi, is this BURANI ROHIT M &? I’m calling about the property at/near 11652 CORAL HILLS CT. I work with builders looking for land deals in Dallas, and your property may fit what they buy. I’m not calling to pressure you — I’m checking whether selling is something you’d consider if the terms made sense.

### 3. CURRY FANNIE MAE — 2034 ANGELINA DR, DALLAS, TX 75212
- Priority: `A-owner-occupant-first`
- Parcel: `00000681256000000`
- Mailing: 2034 ANGELINA DR DALLAS TEXAS 752121711
- TPS name/city: https://www.truepeoplesearch.com/results?name=FANNIE+CURRY&citystatezip=Dallas%2C+TX
- TPS address: https://www.truepeoplesearch.com/resultaddress?streetaddress=2034+ANGELINA+DR+DALLAS+TEXAS+752121711&citystatezip=Dallas%2C+TX
- Match must-have: name match + Dallas/TX or address-history overlap with mailing/property address
- Paste back: `00000681256000000,CURRY FANNIE MAE,<candidatePhone>,<candidateEmail>,<0-100>,manual lookup,<match basis>`
- Opener: Hi, is this CURRY FANNIE MAE? I’m calling about the property at/near 2034 ANGELINA DR. I work with builders looking for land deals in Dallas, and your property may fit what they buy. I’m not calling to pressure you — I’m checking whether selling is something you’d consider if the terms made sense.

### 4. HILLS SUSANNAH J — 3434 ST CLOUD CIR, DALLAS, TX 75229
- Priority: `B-address-variant-review`
- Parcel: `00000595177000000`
- Mailing: 3434 SAINT CLOUD CIR DALLAS TEXAS 752292634
- TPS name/city: https://www.truepeoplesearch.com/results?name=SUSANNAH+HILLS&citystatezip=Dallas%2C+TX
- TPS address: https://www.truepeoplesearch.com/resultaddress?streetaddress=3434+SAINT+CLOUD+CIR+DALLAS+TEXAS+752292634&citystatezip=Dallas%2C+TX
- Match must-have: name match + Dallas/TX or address-history overlap with mailing/property address
- Paste back: `00000595177000000,HILLS SUSANNAH J,<candidatePhone>,<candidateEmail>,<0-100>,manual lookup,<match basis>`
- Opener: Hi, is this HILLS SUSANNAH J? I’m calling about the property at/near 3434 ST CLOUD CIR. I work with builders looking for land deals in Dallas, and your property may fit what they buy. I’m not calling to pressure you — I’m checking whether selling is something you’d consider if the terms made sense.

### 5. AGUINAGA MIREYA — 3111 TOWER TRL, DALLAS, TX 75229
- Priority: `A-owner-occupant-first`
- Parcel: `00000594469000000`
- Mailing: 3111 TOWER TRL DALLAS TEXAS 752292518
- TPS name/city: https://www.truepeoplesearch.com/results?name=MIREYA+AGUINAGA&citystatezip=Dallas%2C+TX
- TPS address: https://www.truepeoplesearch.com/resultaddress?streetaddress=3111+TOWER+TRL+DALLAS+TEXAS+752292518&citystatezip=Dallas%2C+TX
- Match must-have: name match + Dallas/TX or address-history overlap with mailing/property address
- Paste back: `00000594469000000,AGUINAGA MIREYA,<candidatePhone>,<candidateEmail>,<0-100>,manual lookup,<match basis>`
- Opener: Hi, is this AGUINAGA MIREYA? I’m calling about the property at/near 3111 TOWER TRL. I work with builders looking for land deals in Dallas, and your property may fit what they buy. I’m not calling to pressure you — I’m checking whether selling is something you’d consider if the terms made sense.

### 6. TREJO ISIDRO VARGAS & MARIA BLANCA VALDEZ — 3252 TOWER TRL, DALLAS, TX 75229
- Priority: `A-owner-occupant-first`
- Parcel: `00000594265000000`
- Mailing: 3252 TOWER TRL DALLAS TEXAS 752292519
- TPS name/city: https://www.truepeoplesearch.com/results?name=ISIDRO+TREJO&citystatezip=Dallas%2C+TX
- TPS address: https://www.truepeoplesearch.com/resultaddress?streetaddress=3252+TOWER+TRL+DALLAS+TEXAS+752292519&citystatezip=Dallas%2C+TX
- Match must-have: name match + Dallas/TX or address-history overlap with mailing/property address
- Paste back: `00000594265000000,TREJO ISIDRO VARGAS & MARIA BLANCA VALDEZ,<candidatePhone>,<candidateEmail>,<0-100>,manual lookup,<match basis>`
- Opener: Hi, is this TREJO ISIDRO VARGAS & MARIA BLANCA VALDEZ? I’m calling about the property at/near 3252 TOWER TRL. I work with builders looking for land deals in Dallas, and your property may fit what they buy. I’m not calling to pressure you — I’m checking whether selling is something you’d consider if the terms made sense.

### 7. PLATZ MARK A — 3135 ST CROIX DR, DALLAS, TX 75229
- Priority: `B-address-variant-review`
- Parcel: `00000594493000000`
- Mailing: 3135 SAINT CROIX DR DALLAS TEXAS 752292547
- TPS name/city: https://www.truepeoplesearch.com/results?name=MARK+PLATZ&citystatezip=Dallas%2C+TX
- TPS address: https://www.truepeoplesearch.com/resultaddress?streetaddress=3135+SAINT+CROIX+DR+DALLAS+TEXAS+752292547&citystatezip=Dallas%2C+TX
- Match must-have: name match + Dallas/TX or address-history overlap with mailing/property address
- Paste back: `00000594493000000,PLATZ MARK A,<candidatePhone>,<candidateEmail>,<0-100>,manual lookup,<match basis>`
- Opener: Hi, is this PLATZ MARK A? I’m calling about the property at/near 3135 ST CROIX DR. I work with builders looking for land deals in Dallas, and your property may fit what they buy. I’m not calling to pressure you — I’m checking whether selling is something you’d consider if the terms made sense.

### 8. VALLES GRACIELA CASTANEDA — 3238 MODELLA AVE, DALLAS, TX 75229
- Priority: `A-owner-occupant-first`
- Parcel: `00000594412000000`
- Mailing: 3238 MODELLA AVE DALLAS TEXAS 752292515
- TPS name/city: https://www.truepeoplesearch.com/results?name=GRACIELA+VALLES&citystatezip=Dallas%2C+TX
- TPS address: https://www.truepeoplesearch.com/resultaddress?streetaddress=3238+MODELLA+AVE+DALLAS+TEXAS+752292515&citystatezip=Dallas%2C+TX
- Match must-have: name match + Dallas/TX or address-history overlap with mailing/property address
- Paste back: `00000594412000000,VALLES GRACIELA CASTANEDA,<candidatePhone>,<candidateEmail>,<0-100>,manual lookup,<match basis>`
- Opener: Hi, is this VALLES GRACIELA CASTANEDA? I’m calling about the property at/near 3238 MODELLA AVE. I work with builders looking for land deals in Dallas, and your property may fit what they buy. I’m not calling to pressure you — I’m checking whether selling is something you’d consider if the terms made sense.

### 9. CAMARILLO JUANITA M — 3136 TOWER TRL, DALLAS, TX 75229
- Priority: `A-owner-occupant-first`
- Parcel: `00000594490000000`
- Mailing: 3136 TOWER TRL DALLAS TEXAS 752292517
- TPS name/city: https://www.truepeoplesearch.com/results?name=JUANITA+CAMARILLO&citystatezip=Dallas%2C+TX
- TPS address: https://www.truepeoplesearch.com/resultaddress?streetaddress=3136+TOWER+TRL+DALLAS+TEXAS+752292517&citystatezip=Dallas%2C+TX
- Match must-have: name match + Dallas/TX or address-history overlap with mailing/property address
- Paste back: `00000594490000000,CAMARILLO JUANITA M,<candidatePhone>,<candidateEmail>,<0-100>,manual lookup,<match basis>`
- Opener: Hi, is this CAMARILLO JUANITA M? I’m calling about the property at/near 3136 TOWER TRL. I work with builders looking for land deals in Dallas, and your property may fit what they buy. I’m not calling to pressure you — I’m checking whether selling is something you’d consider if the terms made sense.

### 10. LARA RAFAEL JR & OLIVIA S — 3162 MODELLA AVE, DALLAS, TX 75229
- Priority: `A-owner-occupant-first`
- Parcel: `00000594448000000`
- Mailing: 3162 MODELLA AVE DALLAS TEXAS 752292431
- TPS name/city: https://www.truepeoplesearch.com/results?name=RAFAEL+LARA&citystatezip=Dallas%2C+TX
- TPS address: https://www.truepeoplesearch.com/resultaddress?streetaddress=3162+MODELLA+AVE+DALLAS+TEXAS+752292431&citystatezip=Dallas%2C+TX
- Match must-have: name match + Dallas/TX or address-history overlap with mailing/property address
- Paste back: `00000594448000000,LARA RAFAEL JR & OLIVIA S,<candidatePhone>,<candidateEmail>,<0-100>,manual lookup,<match basis>`
- Opener: Hi, is this LARA RAFAEL JR & OLIVIA S? I’m calling about the property at/near 3162 MODELLA AVE. I work with builders looking for land deals in Dallas, and your property may fit what they buy. I’m not calling to pressure you — I’m checking whether selling is something you’d consider if the terms made sense.

### 11. WISE JAMES ROBERT — 11416 CORAL HILLS DR, DALLAS, TX 75229
- Priority: `A-owner-occupant-first`
- Parcel: `00000594019000000`
- Mailing: 11416 CORAL HILLS DR DALLAS TEXAS 752292528
- TPS name/city: https://www.truepeoplesearch.com/results?name=JAMES+WISE&citystatezip=Dallas%2C+TX
- TPS address: https://www.truepeoplesearch.com/resultaddress?streetaddress=11416+CORAL+HILLS+DR+DALLAS+TEXAS+752292528&citystatezip=Dallas%2C+TX
- Match must-have: name match + Dallas/TX or address-history overlap with mailing/property address
- Paste back: `00000594019000000,WISE JAMES ROBERT,<candidatePhone>,<candidateEmail>,<0-100>,manual lookup,<match basis>`
- Opener: Hi, is this WISE JAMES ROBERT? I’m calling about the property at/near 11416 CORAL HILLS DR. I work with builders looking for land deals in Dallas, and your property may fit what they buy. I’m not calling to pressure you — I’m checking whether selling is something you’d consider if the terms made sense.

### 12. SUTTON WILLIAM T — 3210 MODELLA AVE, DALLAS, TX 75229
- Priority: `A-owner-occupant-first`
- Parcel: `00000594394000000`
- Mailing: 3210 MODELLA AVE DALLAS TEXAS 752292515
- TPS name/city: https://www.truepeoplesearch.com/results?name=WILLIAM+SUTTON&citystatezip=Dallas%2C+TX
- TPS address: https://www.truepeoplesearch.com/resultaddress?streetaddress=3210+MODELLA+AVE+DALLAS+TEXAS+752292515&citystatezip=Dallas%2C+TX
- Match must-have: name match + Dallas/TX or address-history overlap with mailing/property address
- Paste back: `00000594394000000,SUTTON WILLIAM T,<candidatePhone>,<candidateEmail>,<0-100>,manual lookup,<match basis>`
- Opener: Hi, is this SUTTON WILLIAM T? I’m calling about the property at/near 3210 MODELLA AVE. I work with builders looking for land deals in Dallas, and your property may fit what they buy. I’m not calling to pressure you — I’m checking whether selling is something you’d consider if the terms made sense.
