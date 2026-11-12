var timerInterval = null;
var elapsedSeconds = 0;
var attemptHistory = new Array();

var RAW_WORDS = [
    "ABA ACI AÇI ADA ADİ AĞA AHU AİT AKS ALA ALP ALT AMA ANA ANI ANİ ARA ARI ARİ ARK ARP ARŞ ART ARZ ASA ASİ AŞK ATA ATİ AYA AYI AYN",
    "BAĞ BAL BAN BAR BAS BAŞ BAT BAY BAZ BEK BEL BEN BEŞ BEY BEZ BİN BİR BİT BİZ BOĞ BOL BOŞ BOY BOZ BÖL BUL BUN BUZ BÜK",
    "CAM CAN CAR CAZ CEM CEP CET CİN CİP COŞ CÜZ",
    "ÇAĞ ÇAK ÇAL ÇAM ÇAN ÇAP ÇAR ÇAT ÇAY ÇEK ÇEL ÇEM ÇEN ÇEP ÇET ÇIĞ ÇIK ÇIN ÇİĞ ÇİL ÇİM ÇİN ÇİP ÇİS ÇİT ÇİZ ÇOK ÇÖL ÇÖP ÇÖZ",
    "DAĞ DAL DAM DAR DAY DAZ DEF DEK DEM DEN DER DEV DIŞ DİK DİL DİN DİP DİR DİŞ DİZ DOĞ DOK DOL DON DOY DÖK DÖL DÖN DÖV DUA DUL DUR DUŞ DUT DUY DÜN DÜR DÜŞ DÜZ",
    "EBE EDA EFE EGE EGO EĞE EKİ EKS ELA ELE ELİ EME EMİ ERG ERK ESİ EŞİ ETİ EZA",
    "FAK FAL FAN FAR FAS FAY FAZ FEN FER FES FIK FIR FİŞ FİT FOŞ FÖY FUL",
    "GAM GAR GAZ GEÇ GEL GEM GEN GEZ GIK GIR GİR GİT GİY GİZ GOL GÖÇ GÖK GÖL GÖM GÜN GÜR GÜZ",
    "HAC HAÇ HAK HAL HAM HAN HAP HAR HAS HAT HAY HAZ HEM HEP HER HIZ HİÇ HİN HİS HOŞ HUN HUR HÜR",
    "ILK IRK IRZ ISI İÇİ İDE İFA İLA İLE İLK İMA İNÇ İPE İRİ İSA İŞİ İTİ İYİ JEL JİP",
    "KAÇ KAH KAK KAL KAM KAN KAP KAR KAS KAŞ KAT KAY KAZ KEK KEL KEM KEP KER KES KEŞ KEZ KIL KIN KIR KIŞ KIT KIZ KİL KİM KİN KİP KİR KİŞ KİT KOF KOK KOL KOM KON KOP KOR KOŞ KOV KOY KOZ KÖK KÖR KÖY KÖZ KUL KUM KUR KUŞ KUT KÜF KÜL KÜP KÜR KÜS KÜT",
    "LAF LAK LAL LAM LAP LAZ LEB LEŞ LİF LİG LİM LİR LOK LOP LOŞ LOT LÖK LÜP",
    "MAÇ MAH MAL MAN MAT MAY MEN MEY MİL MİM MİN MİR MİS MİT MOR MUM MUŞ MUZ",
    "NAL NAM NAN NAR NAS NAZ NEM NET NEY NİŞ NOT NUR OBA ODA OHA OKA ONS ORA ORT OYA",
    "ÖÇÜ ÖDE ÖDÜ ÖĞE ÖLÇ ÖLÜ ÖNE ÖRT ÖRÜ ÖTE ÖTÜ ÖZE ÖZÜ",
    "PAH PAK PAL PAN PAR PAS PAT PAY PEK PES PEY PIR PIS PİÇ PİK PİL PİM PİR PİS PİŞ POF POP POS POT POZ PUF PUL PUS PUT PÜF",
    "RAB RAF RAM RAP RAY RAZ RET REY ROL ROM ROT RUH RUM RUS",
    "SAÇ SAF SAĞ SAH SAK SAL SAM SAN SAP SAR SAS SAT SAV SAY SAZ SEK SEL SEM SEN SER SES SET SEV SEZ SIK SIR SİL SİM SİN SİS SİT SİZ SOK SOL SOM SON SOR SOS SOY SÖK SÖN SÖV SÖZ SUÇ SUL SUN SUS SUT SÜS SÜT",
    "ŞAH ŞAK ŞAL ŞAN ŞAP ŞAR ŞAT ŞAY ŞEF ŞEK ŞEM ŞEN ŞER ŞEY ŞIK ŞIP Şİİ ŞİK ŞİL ŞİM ŞİP ŞİR ŞİŞ ŞOK ŞOR ŞOV ŞUT",
    "TAB TAÇ TAK TAL TAM TAN TAP TAR TAS TAŞ TAT TAV TAY TAZ TEK TEL TEM TEN TER TES TEZ TIK TIN TIP TIR TİK TİM TİN TİP TİR TİZ TOK TOL TON TOP TOR TOS TOY TOZ TÖS TUĞ TUL TUN TUR TUŞ TUT TUZ TÜL TÜM TÜN TÜP TÜR TÜY TÜZ",
    "UFA ULA ULU UNA UNU URA USA UZA ÜÇÜ ÜRE ÜST ÜTÜ ÜYE VAH VAK VAL VAR VAY VAZ VER VEY VIZ VİN VİZ",
    "YAĞ YAK YAL YAM YAN YAP YAR YAS YAŞ YAT YAY YAZ YEK YEL YEM YEN YER YET YIK YIL YİN YİV YOK YOL YOM YON YOR YOZ YÖN YUM YUN YUT YÜK YÜN YÜZ ZAM ZAN ZAR ZAT ZEM ZER ZIK ZIR ZIT ZİL ZİN ZOR ZÜL",

    "ABLA ACAR ACEM ACIL AÇIK AÇIŞ AÇMA ADAM ADAY ADEM ADET ADIM ADİL ADLİ AFET AĞAÇ AĞIR AĞIZ AĞRI AİLE AJAN AKAR AKIL AKIM AKIN AKIŞ AKİL AKİS AKİT AKLİ AKOR AKSİ ALAN ALAY ALÇI ALDI ALEM ALET ALEV ALGI ALIM ALIN ALIŞ ALİM ALMA ALTI AMAÇ AMAN AMCA AMEL AMİR AMİP ANCA ANIT ANMA ANNE ARAP ARAZ ARDI ARGO ARIK ARIZ ARİF ARKA ARMA ARPA ARSA ARTI ARZU ASAL ASIL ASIR ASİL ASİT ASKI ASLA ASLİ ASMA AŞIK AŞMA ATAK ATIK ATIL ATIM ATIŞ ATKI ATMA ATOM AVAM AVCI AVLU AYAK AYAR AYAZ AYET AYIK AYIP AYIR AYNA AYNI AYRI AZAP AZIK AZİM AZİZ",
    "BABA BACA BACI BAĞA BAKİ BALO BANA BANK BANT BARI BARK BARO BASI BATI BAYİ BAZA BAZI BEBE BEİS BELA BENT BERE BERİ BESİ BETA BEZE BİAT BİLE BİNA BİRA BİRİ BLOK BLUZ BOĞA BOKS BOLU BONO BORÇ BORU BOYA BOYU BRİK BUĞU BUJİ BURA BURÇ BURS BÜFE BÜRO BÜYÜ",
    "CABA CADI CAMİ CANA CANİ CARİ CEFA CELP CENK CEZA CIVA CİCİ CİLA CİLT CİNS CİPS CUMA ÇABA ÇAĞA ÇAKI ÇALI ÇAPA ÇARE ÇARK ÇATI ÇENE ÇERİ ÇETE ÇIKI ÇIMA ÇIRA ÇITA ÇİFT ÇİLE ÇİPO ÇİVİ ÇİZİ ÇOĞU ÇUKA",
    "DADI DAHİ DAİM DAİR DAMA DANA DANS DARA DARI DART DAVA DAYE DAYI DEBİ DEDE DEFA DEHA DELİ DEME DENK DERE DERİ DERS DERT DEVA DEVE DIŞI DİNÇ DİRİ DİŞİ DİVA DİYE DİZİ DOĞA DOĞU DOKU DOLU DONA DOST DRAM DUBA DURU DUYU DÜET DÜŞE DÜZE",
    "EBAT EBRU ECEL EDAT EDEP EDER EĞER EĞİK EĞİL EĞİM EĞİR EKİM EKİN EKİP EKLİ EKME EKSİ EKŞİ ELÇİ ELDE ELEK ELEM ELİF ELMA ELTİ EMAN EMEK EMEL EMİN EMİR EMME EMMİ ENAM ENİK ENLİ ENSE EREN ERİK ERİL ERİM ERİN ERİŞ ERKE ESAS ESEN ESER ESİK ESİN ESİR ESKİ ESME ESNA EŞEK EŞİK EŞİT EŞLİ EŞYA ETEK ETKİ ETLİ ETME EVCİ EVET EVİN EVLA EVLİ EZAN EZGİ EZİK EZME",
    "FAAL FAİK FAİL FAİZ FAKS FANİ FARE FARK FARZ FAUL FECR FEDA FELÇ FENA FERT FEZA FİDE FİLE FİLM FİLO FİRE FOÇA FOLK FORM FORS FOTO FUAR FÜZE",
    "GALA GALE GAMA GANI GARD GASP GAYE GAZİ GEBE GECE GEÇE GEMİ GENÇ GENE GERİ GEZİ GIDA GINA GİBİ GİDİ GİŞE GONK GÖÇE GÖLE GÖMÜ GÖRE GÖRÜ GÖZE GRAM GREV GRİP GRUP GÜCÜ GÜDÜ GÜLÜ GÜNÜ GÜRE GÜRZ GÜVE GÜYA",
    "HACI HADİ HAİN HAKİ HALA HALE HALI HALK HALT HAMİ HANE HANİ HARÇ HARE HARF HARP HARS HAŞA HATA HAVA HAYA HAZA HECE HELA HEPA HERİ HIRS HİBE HİLE HİNT HOBİ HOCA HURÇ HURİ HUŞU ILIK ISIN ISKA IŞIK IŞIL IŞIN ITIR",
    "İADE İANE İARE İBDA İBİK İBNE İBRE İCAT İCRA İÇİM İÇİŞ İÇKİ İÇLİ İÇME İDAM İDEA İDİL İFŞA İĞDE İĞNE İKAZ İKİZ İLAÇ İLAH İLAN İLÇE İLGİ İLİK İLİM İLKE İLME İMAJ İMAL İMAM İMAN İMAR İMGE İMHA İMLA İMZA İNAN İNAT İNCE İNCİ İNİK İNİŞ İNME İPÇİ İPEK İRAN İRİN İRİS İSİM İTME İVME İZAH İZİN İZLE JANT JEST JÜRİ",
    "KABA KAÇA KAÇI KADE KAFA KAFE KAFİ KALA KALE KALP KAMA KAMU KANA KANI KANT KAPI KARA KARE KARI KARO KARS KART KASA KASE KASK KAST KAŞE KATI KATİ KAYA KAYI KAZA KAZI KEDİ KELE KENE KENT KERE KESE KESİ KİLO KİRA KİVİ KLAS KLİK KLİP KOCA KOÇA KOKU KOLA KOLİ KONU KORO KORU KOŞA KOŞU KOVA KOYU KOZA KÖLE KÖSE KÖŞE KÖŞK KÖTÜ KRAL KREM KREŞ KRİZ KROM KULE KUMA KUPA KURA KURT KURU KUTU KUYU KUZU KÜME KÜPE KÜRE KÜRK",
    "LAKA LAKE LALA LALE LAMA LAPA LARP LAŞE LAVA LİNK LİRA LİSE LOBİ LOCA LODA LORT MAAŞ MAÇA MAİL MAKİ MALA MAMA MANA MANO MAPA MARŞ MART MASA MAŞA MAVİ MAYA MAYO MAZİ MEAL MENÜ MERA MERT MEST MEŞE MEZE MİDE MİKA MİNİ MİRA MİSK MODA MOLA MONT MUAF MÜFT MÜZE",
    "NAAŞ NAFİ NAİF NAİL NAME NANE NARA NAZI NEBİ NEMA NEMF NENE NEON NEŞE NEVA NİCE NİDA NİNE NİSA NİYET NOTA NÖTR OBJE OBUR OCAK ODAK ODUN OFİS OĞUL OKKA OKUL OKUR OLAY OLGU OLMA OLTA OLUK OMUR OMUZ ONAY ONUR OPAL OPER ORAN ORDU ORTA ORUÇ OTEL OVAL OYMA OYUK OYUN OZAN OZON",
    "ÖBÜR ÖDEV ÖDÜL ÖFKE ÖĞLE ÖKÇE ÖKÜZ ÖLÇÜ ÖLÜM ÖMÜR ÖNCÜ ÖNEL ÖNEM ÖPÜŞ ÖRME ÖRTÜ ÖTÜŞ ÖVGÜ ÖYKÜ ÖZEL ÖZET ÖZGÜ ÖZNE ÖZÜR PAÇA PAHA PAKT PALA PANO PAPA PARA PARE PARK PARS PASO PAŞA PATİ PAYE PAZI PEÇE PEKİ PENA PENS PERİ PERT PEŞİ PİKE PİPO PİRE PİST PLAN PLAJ POSA POST PUAN PUMA PUNÇ",
    "RACA RAKS RAMİ RANT RAST RAZI REEL REİS REJİ RENK REVA RİCA RİSK RİYA ROBA ROKA ROTA RÖLE RUJİ RUMA RÜYA SAAT SABA SABİ SAÇI SADE SAFA SAFİ SAHA SAHİ SAİK SAKA SAKİ SALA SALI SALT SANA SANI SAPA SAPI SARA SARF SARI SARP SAYA SAYI SEDA SEFA SELA SELE SEMA SEMT SENA SENE SERA SERİ SERT SEVK SEZİ SILA SIRA SIRF SIRP SIVA SIVI SİMA SİNE SİNİ SİRK SİTE SİVİ SKOR SLAV SOBA SODA SOFA SOFU SOKU SOLA SOMA SOPA SORU SOYA SÖKE SPOR STAT STOK STOR SUAL SUNA SUNİ SURA SURE SÜRE SÜRÜ",
    "ŞAFT ŞAİR ŞAKA ŞALE ŞANS ŞARJ ŞARK ŞART ŞASE ŞASİ ŞATO ŞAVK ŞAYE ŞECİ ŞELF ŞEMA ŞERH ŞERİ ŞİAR ŞİFA ŞİİR ŞİKE ŞİLE ŞİLT ŞİRE ŞİŞE ŞOKE ŞORT ŞUBE ŞUUR TABA TABİ TABL TABU TAHT TAKA TAKI TANE TANI TAPA TAPI TAPU TARZ TASA TAŞI TAUN TAVA TAYA TAYF TAZE TEFE TEİN TEKE TELA TEMA TEPE TERE TERK TERS TEST TİPİ TİRE TOKA TOPU TORK TOST TREN TUBA TURA TURP",
    "UCUZ UÇAK UÇAR UÇMA UÇUK UÇUŞ UFAK UĞRA UĞUR ULAK ULAM ULAŞ ULUM ULUS ULVİ UMAR UMMA UMRE UMUT URAY URBA URFA USUL UŞAK UYAK UYAR UYKU UYMA UYUM UYUZ UZAK UZAM UZAY UZUN UZUV ÜÇLÜ ÜLKE ÜLKÜ ÜMİT ÜNLÜ ÜNÜŞ ÜREM ÜRÜN ÜSTE ÜŞÜŞ ÜZRE ÜZÜM VAAT VADE VADİ VAHA VAİZ VAKA VAKF VAKİ VALE VALF VALİ VAMP VASİ VAZO VEBA VEDA VEFA VELİ VERİ VİDA VİNÇ VİZE",
    "YABA YADİ YAFA YAĞI YAKA YAKI YALI YAMA YANI YAPI YARA YARI YASA YAŞA YATI YAYA YAZI YEDİ YEİS YELE YEME YENİ YETİ YIKI YIVA YİĞİ YİNE YOGA YOMA YÖRE YUMA YUNA YURT YUVA YÜCE YÜRE YÜRÜ ZAAF ZADE ZAİT ZAMK ZAPT ZARA ZARF ZATİ ZAYI ZEKİ ZEVK ZINA ZIRH ZİFT ZİLE ZİNA ZİRA ZİYA ZONK",

    "ABONE ACEMİ ACILI AÇLIK AÇMAK ADALE ADINA ADRES AFYON AĞMAK AHLAK AHŞAP AİDAT AKICI AKMAK AKRAN AKREP AKSAM AKŞAM AKTAR AKTİF AKTÖR ALACA ALARM ALBÜM ALÇAK ALENİ ALEVİ ALICI ALKIM ALKIŞ ALLAH ALMAK ALTIN AMBAR AMİGO ANCAK ANKET ANLAM ANLIK ANMAK ANONS ANTEN ANTİK APTAL ARABA ARACI ARAZİ ARDIL ARIZA ARİFE ARMUT ARSIZ ARŞİV ARTIK ARTIŞ ARTMA ASABİ ASKER ASLAN ASMAK ASTAR ASTIM AŞAĞI AŞAMA AŞURE ATAMA ATICI ATMAK AVANS AVARE AVIZE AYDIN AYGIR AYGIT AYLAK AYLIK AYMAK AYRAN AYRIK AYRIM AZAMİ AZGIN AZLIK AZMAK",
    "BABET BADEM BAGAJ BAHAR BAHÇE BAHİS BAHRİ BAKAN BAKIM BAKIŞ BAKİR BAKLA BALIK BALON BALTA BAMYA BANKA BANYO BARAJ BARAK BARDAK BARET BARIŞ BARİZ BARON BARUT BASIK BASIM BASIN BASIŞ BASKI BASMA BAŞAK BAŞKA BAŞLI BATAK BATIK BATIŞ BATMA BAVUL BAYAN BAYAT BAYIR BAZEN BEDEL BEDEN BEKAR BEKÇİ BELGE BELGİ BELKİ BELLİ BENCİ BENİZ BENLİ BERAT BERİL BESİN BESTE BEŞER BEŞİK BETON BEYAN BEYAZ BEYİN BEZİK BIÇAK BIKMA BIYIK BİBER BİÇİM BİÇME BİDON BİLET BİLGE BİLGİ BİLİM BİLİŞ BİLME BİNEK BİNİŞ BİNME BİRAZ BİREY BİRİM BİTKİ BİTME BİYEL BİZCE BİZİM BLOKE BOBİN BOĞAZ BOĞMA BOLCA BOMBA BORAN BORSA BOYUN BOYUT BOZMA BOZUK BÖCEK BÖLGE BÖLME BÖLÜK BÖLÜM BÖREK BRANŞ BRONŞ BRONZ BUÇUK BUHAR BUKET BULGU BULMA BULUT BURCU BURGU BURMA BURUN BUTİK BUYUR BUZLU BÜCÜR BÜKME BÜYÜK",
    "CACIK CADDE CAHİL CAİZE CAMCI CAMİA CANAN CANLI CAZİP CEBİR CEKET CEMAL CEPHE CESET CESUR CEVAP CEVİZ CEZAİ CİDDİ CİĞER CİHAN CİHAZ CİHET CİLVE CİMRİ CİNSİ CİVAR CİZRE CUMBA CÜMLE CÜSSE",
    "ÇABUK ÇADIR ÇAĞLA ÇAĞRI ÇAKAL ÇAKAR ÇAKIL ÇAKIR ÇAKIŞ ÇAKMA ÇALGI ÇALIK ÇALIM ÇALIŞ ÇALMA ÇAMUR ÇANAK ÇANTA ÇAPAK ÇAPUT ÇARIK ÇARKI ÇARPI ÇARŞI ÇATAL ÇATIK ÇATIŞ ÇATMA ÇAVUŞ ÇAYCI ÇAYIR ÇEHRE ÇEKİÇ ÇEKİK ÇEKİM ÇEKİŞ ÇEKME ÇELİK ÇELME ÇEMEN ÇENEK ÇEPER ÇEŞİT ÇEŞME ÇETİN ÇEVİK ÇEVRE ÇEYİZ ÇIĞIR ÇIKAR ÇIKIK ÇIKIŞ ÇIKMA ÇINAR ÇIRAK ÇIRPI ÇITIR ÇİÇEK ÇİFTE ÇİĞDE ÇİĞİT ÇİLEK ÇİMEN ÇİNKO ÇİROZ ÇİVİT ÇİZİK ÇİZİM ÇİZME ÇOBAN ÇOCUK ÇOĞUL ÇOKÇA ÇOLAK ÇORAP ÇORBA ÇÖKME ÇÖKÜK ÇÖMEL ÇÖPLÜ ÇÖREK ÇÖZME ÇÖZÜM ÇUBUK ÇUKUR ÇUVAL ÇÜRÜK",
    "DAĞCI DAHİL DAİMA DAİRE DAKİK DALAK DALGA DALICI DALIŞ DALMA DAMAK DAMAR DAMAT DAMGA DAMLA DANIŞ DARBE DAVAR DAVET DAYAK DEBBE DEDİK DEĞER DEĞİL DEĞİM DEĞİN DEĞİŞ DEĞME DEKAN DEKOR DELGİ DELİK DELİL DELME DEMET DEMİR DEMLİ DENEK DENEY DENGE DENİZ DENLİ DENME DERBİ DERGİ DERİN DERME DERYA DESEN DESTE DEŞME DETAY DEVAM DEVİR DEVRE DEYİM DEYİŞ DIŞKI DİBEK DİCLE DİDEM DİĞER DİKEL DİKEN DİKEY DİKİM DİKİŞ DİKME DİLİM DİLME DİMAĞ DİNAR DİNGO DİNME DİREK DİREN DİRİL DİSKO DİŞÇİ DİŞLİ DİVAN DİYAR DİYET DİYEZ DİZEL DİZGE DİZGİ DİZİM DİZİN DİZME DOĞAL DOĞAN DOĞMA DOĞRU DOĞUM DOĞUŞ DOKUZ DOLAP DOLAR DOLGU DOLMA DOLUŞ DONUK DOSYA DOYMA DOYUM DÖKME DÖKÜM DÖNER DÖNGÜ DÖNME DÖNÜM DÖNÜŞ DÖŞEK DÖVİZ DÖVME DUDUK DUMAN DURAK DURAL DURGU DURMA DURUM DURUŞ DUVAK DUVAR DUYGU DUYMA DUYUM DUYUŞ DÜBEL DÜĞME DÜĞÜM DÜĞÜN DÜMEN DÜNYA DÜRÜM DÜRZÜ DÜŞES DÜŞEY DÜŞME DÜŞÜK DÜŞÜN DÜŞÜŞ DÜZEN DÜZEY DÜZME",
    "EBCET EBRUŞ EDALI EDEBİ EFKAR EGZOZ EĞMEK EMLAK EMSAL EMTİA ENDER ENFES ENGEL ENGİN ENKAZ ENLEM ERDEM ERGEN ERGİN ERİME ERKEK ERKEN ERKİN ERMEK EROİN ERSİZ ERZAK ESANS ESASLI ESNAF ESNEK ESPRİ ESRAR EŞARP EŞSİZ ETKEN ETKİN ETMEK ETNİK ETRAF EVHAM EVLAT EVRAK EVREN EVRİM EYLEM EYLÜL EZBER EZELİ EZİCİ EZMEK",
    "FAHİŞ FAHRİ FAKİR FALCI FANUS FARAŞ FARAZİ FASIL FASİH FATİH FAYDA FAZLA FECİR FENER FERAH FERDİ FERİK FESAT FETİH FETVA FEVRİ FEYİZ FİDAN FİGÜR FİKRİ FİLİZ FİNAL FİRAR FİRMA FİŞEK FİYAT FİZİK FLAMA FLÖRT FORMA FORVET FOSİL FRENK FUAYE",
    "GADİR GAFİL GALİP GALOŞ GAMZE GARAJ GARİP GASİL GAYET GAYRİ GAZAP GAZEL GAZOZ GEBZE GEÇEN GEÇER GEÇİM GEÇİŞ GEÇİT GEÇME GEDİK GELEN GELİN GELİR GELİŞ GELME GENEL GENİŞ GENİZ GEREÇ GEREK GERGİ GERME GEVŞEK GEYİK GEZİCİ GEZME GICIK GIDIK GİDER GİDİŞ GİRİŞ GİRME GİTAR GİYİM GİYİŞ GİYME GİZEM GİZLİ GONCA GÖBEK GÖÇER GÖÇME GÖĞÜS GÖLGE GÖMME GÖMÜK GÖNÜL GÖREV GÖRGÜ GÖRME GÖRÜM GÖRÜŞ GÖVDE GÖZCÜ GÖZDE GUATR GURUR GÜBRE GÜÇLÜ GÜDÜM GÜĞÜM GÜLME GÜLÜŞ GÜMÜŞ GÜNAH GÜNEŞ GÜNEY GÜVEN GÜZEL",
    "HABER HABİS HACİM HACİZ HADDE HADİS HAFİF HAKAN HAKEM HAKİM HAKLI HALAT HALAY HALEF HALEN HALİÇ HALİS HALKA HAMAK HAMAL HAMAM HAMLE HAMUR HANCI HANDE HANIM HANUT HAPİS HARAM HARAP HARBİ HAREM HARİÇ HASAR HASAT HASIM HASIR HASTA HATİP HATTA HAVLU HAVUÇ HAVUZ HAYAL HAYAT HAYIR HAZAR HAZIR HAZİN HEDEF HEKİM HELAL HELVA HEMEN HENÜZ HEPSİ HERİF HERKES HESAP HEVES HEYBE HEYET HIZIR HIZLI HİCAP HİCAZ HİLAL HİNDİ HİSSE HİTAP HOROZ HUKUK HUMMA HURDA HURMA HUSUS HUZUR HÜCRE HÜCUM HÜKÜM HÜNER HÜZÜN",
    "ILGIN ILICA IRGAT IRMAK ISLAH ISLAK ISLIK ISRAR IŞIMA",
    "İBARE İBLİS İBRİK İCAP İCAT İCRAAT İÇECEK İÇERİK İÇKİCİ İÇSEL İDAME İDARE İDEAL İDMAN İFADE İFFET İFLAS İFTAR İHALE İHBAR İHLAL İHMAL İHTAR İKAME İKAZ İKİNCİ İKLİM İKMAL İKNA İKRAM İKSİR İLAHİ İLAVE İLERİ İLETİ İLGİLİ İLİNTİ İLKEL İLLET İMAMET İMKAN İMLA İNCİR İNEK İNFAZ İNKAR İNSAF İNSAN İPEKÇİ İPLİK İPTAL İPUCU İRADE İRİCE İRONİ İSHAL İSKAN İSLAM İSPAT İSRAF İSTEK İSTEM İSYAN İŞÇİ İŞGAL İŞLEM İŞLEV İŞTAH İTAAT İTİNA İTMEK İVME İZAFİ İZBE İZCİ İZİN",
    "JİLET JOKER",
    "KABAK KABİN KABİR KABLO KABUK KABUL KAÇAK KAÇIK KAÇIŞ KAÇMAK KADEH KADEM KADER KADIN KADİM KADİR KADRO KAFES KAĞIT KAHIR KAHİN KAHPE KAHVE KAİDE KAKAO KALAY KALÇA KALEM KALICI KALIP KALIŞ KALKAN KALKIŞ KALORİ KAMARA KAMBUR KAMERA KAMIŞ KAMYON KANAL KANAT KANCA KANDİL KANIT KANMAK KANSER KANTAR KANTİN KANUN KAPAK KAPALI KAPAMA KAPICI KAPMAK KAPUT KARACA KARAR KARBON KARDEŞ KARGA KARGO KARIN KARMA KARNE KARPUZ KARŞI KARTAL KARTON KARTUŞ KASABA KASAP KASET KASIK KASIM KASIT KASVET KAŞAR KAŞIK KATAR KATIR KATİP KATKI KATMAN KAVAK KAVAL KAVGA KAVİM KAVİS KAVRAM KAVŞAK KAVUN KAYAK KAYGI KAYIK KAYIN KAYIP KAYIŞ KAYIT KAYMAK KAYNAK KAYNAR KAYPAK KAZAK KAZAN KAZANÇ KAZIK KAZIMA KAZMA KEBAP KEDER KEFAL KEFEN KEFİL KEFİR KEKLİK KELAM KELİME KEMER KEMİK KENAR KENDİ KEPÇE KEPEK KERİZ KERMEN KERVAN KESAT KESEK KESER KESİCİ KESİK KESİM KESİN KESİR KESİT KESKİN KESME KEŞİF KEŞKE KETEN KEYİF KIBRIS KIDEM KILÇIK KILIF KILIK KILIÇ KINALI KINAMA KIRBAÇ KIRIK KIRIM KIRKMA KIRPMA KISACA KISIK KISIM KISIR KISIT KISKANÇ KISKIS KISMA KISMEN KISMET KISRAK KIŞLA KITA KIVAM KIYAK KIYAS KIYI KIYMA KIZAK KIZGIN KIZIL KIZLIK KIZMAK KİBAR KİBİR KİBRİT KİLER KİLİM KİLİT KİMYA KİNAYE KİRAZ KİREÇ KİRİŞ KİRLİ KİRPİ KİRPİK KİTAP KİTLE KLARNET KLASİK KLAVYE KLİMA KOBAY KOÇAN KOĞUŞ KOKMA KOLAJ KOLAY KOLEJ KOLERA KOLİ KOLON KOLONYA KOLTUK KOMBİN KOMEDİ KOMİK KOMİSER KOMİTE KOMPLO KOMŞU KOMUT KONAK KONFOR KONGRE KONİK KONSER KONSEY KONUK KONUM KONUT KONYAK KOPMA KOPUK KORKAK KORKMA KORKU KORNA KORNEA KORSE KORUMA KOŞMA KOŞUL KOŞUM KOVAN KOYUN KOYUŞ KÖFTE KÖHNE KÖKEN KÖKLÜ KÖKSÜZ KÖMÜR KÖPEK KÖPRÜ KÖPÜK KÖREBE KÖRFEZ KÖRÜK KÖYLÜ KRAKER KRAMP KRAVAT KREDİ KREMA KRİSTAL KRİTER KRİTİK KROKİ KRONİK KUBBE KUCAK KUDRET KUKLA KULAK KULİS KULÜBE KULÜP KUMANDA KUMANYA KUMAR KUMAŞ KUMRAL KUMRU KUMSAL KUNDAK KUNDURA KUPON KURAL KURAM KURBAN KURGU KURMA KURNA KURNAZ KURŞUN KURUŞ KUSMA KUSUR KUŞAK KUŞKU KUTLU KUTSAL KUTUP KUVVET KUYRUK KUYUMCU KUZEN KUZEY KÜÇÜK KÜFÜR KÜLAH KÜLÇE KÜLHAN KÜLLÜK KÜLTÜR KÜLÜNK KÜMES KÜNYE KÜREK KÜRSÜ KÜSKÜN KÜSME KÜSUR KÜTLE KÜTÜK",
    "LADES LAFIZ LAĞIM LAHANA LAHİT LAKAP LAKİN LAMBA LANET LAPTOP LASTİK LATİF LAVABO LAYIK LAZIM LEĞEN LEHÇE LEHİM LEKE LEOPAR LEVENT LEVHA LEYLAK LEYLEK LEZZET LİBERAL LİDER LİMAN LİMON LİRİK LİSAN LİSTE LİTRE LİYAKAT LOJMAN LOKAL LOKANTA LOKMA LOKUM LONCA LÜGAT LÜKS LÜTFEN LÜZUM",
    "MAARİF MAAŞ MACERA MACUN MADALYA MADDE MADEM MADEN MAFSAL MAĞARA MAĞAZA MAĞDUR MAĞLUP MAĞRUR MAHALLE MAHCUP MAHFUZ MAHİR MAHKEME MAHKUM MAHLUK MAHMUR MAHRUM MAHSUL MAHSUS MAHYA MAKALE MAKAM MAKARA MAKARNA MAKAS MAKET MAKİNE MAKSAT MAKTUL MAKUL MALİK MALİYE MALUM MALZEME MANAV MANDAL MANDALİNA MANGA MANGAL MANİ MANİA MANİKÜR MANKEN MANTAR MANTIK MANTO MANZARA MARATON MARAZ MARİFET MARKA MARKET MARMARA MARTI MARUL MASAL MASKE MASRAF MASUM MATBAA MATEMATİK MATERYAL MATKAP MATRAH MAYA MAYDANOZ MAYIN MAYIS MAYMUN MAZHAR MAZOT MAZUR MECAZ MECBUR MECLİS MECNUN MECRA MEÇHUL MEDENİ MEDYA MEFHUM MEĞER MEKAN MEKİK MEKTUP MELİKE MELODİ MELTEM MEMLEKET MEMNUN MEMUR MENDİL MENFAAT MENGENE MENŞE MENZİL MERAK MERAM MERCAN MERCİMEK MERDİVEN MERHAMET MERHEM MERİH MERKEZ MERMER MERTLİK MESAİ MESAJ MESANE MESELE MESİRE MESKEN MESLEK MESNET MESUL MESUT MEŞALE MEŞGUL MEŞHUR MEŞİN MEŞRU MEŞRUBAT METAL METANET METEOR METİN METOT METRE METRO MEVCUT MEVKİ MEVLİT MEVSİM MEVZU MEYDAN MEYİL MEYVE MEZAR MEZUN MİDYE MİHENK MİHRAP MİKROP MİKTAR MİLAT MİLLET MİLLİ MİLYAR MİLYON MİMAR MİMİK MİNARE MİNDER MİNİK MİNNET MİRAS MİSAFİR MİSAL MİSKİN MİSYON MİZAH MİZAN MOBİLYA MODEL MODERN MONİTÖR MONTAJ MORAL MORFİN MOTİF MOTOR MOZAİK MUADİL MUAMMA MUAYENE MUCİT MUCİZE MUHABBET MUHACİR MUHAFIZ MUHAKKAK MUHALEFET MUHARREM MUHASEBE MUHATAP MUHTAR MUHTAÇ MUHTEMEL MUHTEVA MUMYA MURAT MUSLUK MUŞAMBA MUTFAK MUTLAK MUTLU MUVAFFAK MUZİP MÜBAREK MÜCADELE MÜCEVHER MÜDÜR MÜESSESE MÜFETTİŞ MÜFLİS MÜHENDİS MÜHİM MÜHLET MÜHÜR MÜJDE MÜKAFAT MÜKEMMEL MÜLK MÜMKÜN MÜNASEBET MÜNEVVER MÜNFERİT MÜNKİR MÜRACAAT MÜRİT MÜRŞİT MÜSAADE MÜSABAKA MÜSAİT MÜSAMERE MÜSVEDDE MÜSLÜMAN MÜŞAVİR MÜŞTERİ MÜTEAHHİT MÜTEVAZI MÜTHİŞ MÜZAYEDE MÜZE MÜZİK",
    "NABIZ NADİR NAFİLE NAĞME NAHİF NAHİYE NAKAVT NAKİL NAKİT NAKLİYE NALBUR NAMUS NAMZET NANKÖR NARİN NASİHAT NASİP NASIR NAZAR NAZİK NAZIM NAZLI NEBAT NEDEN NEFES NEFİS NEFRET NEHİR NEMLİ NESİL NESNE NEŞELİ NEŞTER NETİCE NEVİ NEZAKET NEZLE NİDA NİFAK NİHAYET NİKAH NİKEL NİMET NİSAN NİŞAN NİTELİK NİYET NİZAM NOKSAN NOKTA NORMAL NOTER NÖBET NUMARA NUMUNE NURANİ NÜFUS NÜFUZ NÜKTE NÜSHA",
    "OBELİKS OBUA OCAKÇI ODUNCU OFİS OĞLAK OĞLAN OKALI OKUMA OKURYAZAR OKYANUS OLAĞAN OLASILIK OLAY OLGUN OLUKLU OLUMSUZ OLUŞUM OMURGA OMUZ ONARIM ONLUK ONURLU OPERA OPERASYON ORANTI ORDU ORGAN ORGANİK ORMAN ORTAK ORTAM ORUÇ OTELCİ OTOBÜS OTOMOBİL OTORİTE OTURMA OTURUM OVAL OYMAK OYNAK OYUNCAK OZAN ÖBÜR ÖDENEK ÖDEV ÖDÜNÇ ÖFKE ÖĞRENCİ ÖĞRETMEN ÖĞÜN ÖĞÜT ÖKSÜZ ÖLÇEK ÖLÇÜM ÖLÜMCÜL ÖMÜR ÖNCELİK ÖNDER ÖNERİ ÖNLEM ÖNLÜK ÖPÜCÜK ÖRDEK ÖRGÜT ÖRNEK ÖRTÜ ÖTÜRÜ ÖVGÜ ÖYKÜ ÖZDEŞ ÖZEL ÖZEN ÖZET ÖZGÜR ÖZLÜK ÖZNE ÖZÜR ÖZVERİ",
    "PAÇAVRA PAHA PAKET PALTO PAMUK PANCAR PANEL PANİK PANSİYON PANTOLON PAPATYA PAPAZ PARAF PARÇA PARDÖSÜ PARLAK PARMAK PARTİ PASAPORT PASİF PASLI PASTA PATATES PATEN PATİK PATRON PAYDA PAZAR PEÇETE PEDAL PEKMEZ PELTEK PEMBE PENCERE PENÇE PERDE PERGEL PERİYOT PERON PERSONEL PERŞEMBE PERVANE PEŞİN PETEK PETROL PEYGAMBER PEYNİR PIRASA PIRLANTA PİKNİK PİLAV PİLİÇ PİLOT PİRİNÇ PİŞMAN PİYADE PİYANO PİYASA PİYON PLAKA PLASTİK PLATFORM PLATO POĞAÇA POLİS POLİTİKA POMPA PORSELEN PORSİYON PORTAKAL PORTRE POSTA POŞET POTANSİYEL POZİSYON PRATİK PRENS PRENSİP PRİZ PROBLEM PROFESÖR PROGRAM PROJE PROTESTO PROVA PSİKOLOJİ PUDRA PUSULA PÜRÜZ PÜSKÜL",
    "RABITA RADAR RADYO RAĞBET RAHAT RAHİBE RAHİM RAHİP RAHMET RAKAM RAKET RAKİP RAKOR RALLİ RAMAZAN RAMPA RANDEVU RANZA RAPOR RASYONEL REÇEL REÇETE REFAH REHBER REHİN REJİM REKABET REKLAM REKOR REKTÖR RENDE RESİM RESMİ RESTORAN REŞİT REZİL RİMEL RİTİM RİVAYET RİYAKAR RİZİKO ROBOT ROMAN ROMANTİK RÖPORTAJ RÖTAR RUHSAT RULO RUTİN RUTUBET RÜŞVET RÜTBE RÜZGAR",
    "SABAH SABIR SABİT SABUN SAÇMA SADAKAT SADIK SAFHA SAFRA SAĞLAM SAĞLIK SAHİP SAHNE SAHRA SAHTE SAHUR SAİK SAKAL SAKAT SAKİN SAKIZ SAKLI SALATA SALÇA SALDIRI SALGIN SALINCAK SALKIM SALON SALTANAT SAMAN SAMİMİ SANAL SANAT SANAYİ SANCAK SANCI SANDAL SANDALYE SANDIK SANIK SANİYE SANKİ SANSAR SANTİM SANTRAL SAPIK SAPKIN SARAY SARGI SARHOŞ SARIK SARMA SARSINTI SATEN SATIH SATILIK SATIR SATIŞ SAVAŞ SAVCI SAVUNMA SAYAÇ SAYFA SAYGI SAYIN SAZAN SEANS SEBEP SEBZE SECCADE SEÇİM SEÇKİN SEÇME SEDEF SEDİR SEDYE SEFER SEFİL SEFİR SEHER SEHPA SEKİZ SEKME SEKTÖR SELAM SELİM SEMBOL SEMER SEMİNER SENARYO SENDİKA SENET SEPET SERBEST SERÇE SEREN SERGİ SERİN SERMAYE SERSERİ SERVET SERVİS SESLİ SEVGİ SEVİYE SEYİR SEYİS SEYREK SEYRAN SEZGİ SEZON SICAK SIFAT SIFIR SIĞINAK SIĞIR SIHHAT SIKICI SIKINTI SINAV SINIF SINIR SIRIK SIRITMA SIRMA SIRT SIZINTI SİCİL SİGARA SİGORTA SİHİR SİKKE SİLAH SİLGİ SİLİK SİLKME SİLSİLE SİMGE SİMİT SİMSAR SİNEMA SİNİR SİNSİ SİNYAL SİPARİŞ SİPER SİRKE SİSTEM SİTEM SİVİL SİVRİ SİYAH SİYASET SOFRA SOĞAN SOĞUK SOHBET SOKAK SOLUK SOLUNUM SOMON SOMUT SONBAHAR SONRA SONUÇ SORGU SORUMSUZ SORUN SOSYAL SOYADI SOYUT SÖĞÜT SÖYLEM SÖZCE SÖZLÜK STADYUM STAJ STANDART STATÜ STRATEJİ STRES STÜDYO SUBAY SUCUK SUÇLU SULTAN SUNUM SURAT SURET SUSAM SUSKUN SUSUZ SÜNGER SÜNNET SÜPER SÜRAHİ SÜRAT SÜREÇ SÜREKLİ SÜRÜCÜ SÜSLÜ SÜTUN SÜVARİ",
    "ŞAFAK ŞAHİN ŞAHIS ŞAHİT ŞAHSİ ŞAKAK ŞALVAR ŞAMPİYON ŞANTİYE ŞAPKA ŞARAP ŞARKI ŞAŞKIN ŞEHİR ŞEHİT ŞEKER ŞEKİL ŞELALE ŞEMSİYE ŞENLİK ŞEREF ŞERİT ŞEYTAN ŞİFRE ŞİKAYET ŞİMDİ ŞİMŞEK ŞİRİN ŞİRKET ŞİŞMAN ŞOFÖR ŞÖHRET ŞÖLEN ŞÖMİNE ŞÖVALYE ŞÜKRAN ŞÜPHE",
    "TABAK TABAN TABELA TABİAT TABİP TABLO TABUR TABUT TAHİN TAHLİL TAHMİN TAHRİBAT TAHSİL TAHTA TAKDİR TAKIM TAKİP TAKKE TAKLİT TAKSİ TAKSİT TAKVİM TALEP TALİH TALİMAT TAMAM TAMİR TANIK TANIM TANIŞ TANRI TANSİYON TAPINAK TARAF TARAK TARHANA TARİF TARİH TARİKAT TARLA TARTI TASARI TASDİK TASLAK TASMA TASVİR TAŞIT TAŞRA TATİL TATLI TAVAN TAVIR TAVLA TAVSİYE TAVŞAN TAVUK TAYFA TAYİN TAZİYE TEBDİL TEBESSÜM TEBLİĞ TEBRİK TECAVÜZ TECRÜBE TEDAVİ TEDBİR TEDİRGİN TEHLİKE TEKİR TEKLİF TEKME TEKNE TEKNİK TEKNOLOJİ TEKRAR TELAŞ TELEFON TELEVİZYON TELGRAF TELKİN TEMAS TEMBEL TEMBİH TEMEL TEMİNAT TEMİZ TEMMUZ TEMPO TEMSİL TENCERE TENEKE TENHA TENİS TENTE TEORİ TEPKİ TERAZİ TERCİH TERCÜME TEREK TEREYAĞI TERFİ TERİM TERLİK TERMOMETRE TERÖR TERTİP TESADÜF TESELLİ TESİR TESİS TESLİM TESPİH TESPİT TESTERE TEŞEKKÜR TEŞHİS TEŞKİLAT TEŞVİK TETİK TEVAZU TEYZE TEZAT TEZGAH TIBBİ TIKIZ TILSIM TIRNAK TİCARET TİLKİ TİMSAH TİRAJ TİTREK TİYATRO TOHUM TOKAT TOKMAK TOLERANS TONAJ TOPAL TOPAR TOPÇU TOPLAM TOPLUM TOPRAK TOPTAN TORBA TORNA TORPİL TORTU TORUN TOZLU TÖREN TÖVBE TRAFİK TRAJEDİ TRAKTÖR TRAMVAY TRANSFER TRİBÜN TUĞLA TUHAF TULUM TURİST TURİZM TURNA TURŞU TURUNCU TUTAM TUTAR TUTKAL TUTKU TUTSAK TUTUKLU TUTUM TUVALET TUZAK TUZLU TÜCCAR TÜFEK TÜKENMEZ TÜKETİM TÜLBENT TÜMÖR TÜNEL TÜRKÜ TÜTÜN TÜYSÜZ",
    "UCUBE UÇURUM UĞRAK UĞURLU ULAŞIM ULUSAL UMUMİ UNSUR UNVAN URGAN USANÇ UTANÇ UYARI UYGAR UYGUN UYGULAMA UYKUCU UYLUK UZMAN ÜCRET ÜÇGEN ÜÇÜNCÜ ÜFLEME ÜMMET ÜNİTE ÜNİVERSİTE ÜNVAN ÜREME ÜRETİM ÜRKÜNTÜ ÜSLUP ÜSTAT ÜSTÜN ÜŞENGEÇ ÜZENGİ ÜZGÜN ÜZÜCÜ",
    "VAGON VAHİM VAHŞİ VAKIF VAKİT VAKUM VALİZ VAMPİR VAPUR VARAK VARİL VARİS VARLIK VAROŞ VASAT VASIF VASITA VATAN VATANDAŞ VAZGEÇME VAZİFE VEDALAŞ VEKALET VEKİL VEREM VERGİ VERİM VESİLE VESTİYER VİCDAN VİDEO VİLLA VİRAN VİRÜS VİTES VİTRİN VİYADÜK VİZYON VOLKAN VURGU VURGUN VÜCUT",
    "YABAN YABANCI YAĞCI YAĞIŞ YAĞIZ YAĞLI YAĞMUR YAHUDİ YAKIN YAKIT YAKLAŞIM YAKUP YALAN YALÇIN YALIN YALNIZ YAMAÇ YAMAN YANAK YANGIN YANIK YANIT YANKI YANLIŞ YANSIMA YAPAY YAPIT YAPRAK YARAR YARASA YARATIK YARDIM YARGI YARIM YARIN YARIŞ YASAK YASAL YASİN YASTIK YAŞAM YAŞLI YATAK YATAY YATIRIM YAVAŞ YAVER YAVRU YAYGIN YAYIN YAYLA YAZAR YAZLIK YEDEK YEĞEN YELKEN YEMEK YEMİN YENGE YENİLGİ YEREL YERİNE YERLİ YEŞİL YETENEK YETER YETERLİ YETİM YETKİ YETMİŞ YIĞIN YIKIK YIKIM YILAN YILDIZ YILGI YILLIK YİRMİ YIRTIK YİĞİT YİYECEK YOĞUN YOĞURT YOKLUK YOKSUL YOLCU YOLDAŞ YONCA YORGA YORGAN YORGUN YORUM YÖNELİM YÖNETİM YÖNTEM YUDUM YUFKA YUKARI YULAF YUMAK YUMRU YUMRUK YUMURTA YUMUŞAK YUNUS YUVARLAK YÜKLEM YÜKSEK YÜREK YÜRÜYÜŞ YÜZBAŞI YÜZDE YÜZEY YÜZME YÜZÜK YÜZYIL",
    "ZABIT ZAFER ZAHİR ZAHMET ZALİM ZAMAN ZAMİR ZANAAT ZARAR ZARİF ZAYIF ZEBRA ZEDELİ ZEHİR ZEKA ZEMİN ZENGİN ZERRE ZEYTİN ZIMBA ZIMPARA ZITLIK ZİFİRİ ZİHİN ZİKİR ZİNCİR ZİNDAN ZİRAAT ZİRVE ZİYAN ZİYAFET ZİYARET ZORBA ZORLA ZORLUK ZORUNLU ZÜMRÜT ZÜRAFA",
    "AKADEMİSYEN ALÇAKGÖNÜL ALIŞVERİŞ ALTERNATİF AMELİYATHANE ANLAŞILMAZ ARAŞTIRMA ARKADAŞLIK AYDINLATMA BAĞIMSIZLIK BAŞARILMAK BAŞVURMAK BEKLENMEDİK BİLGİSAYAR BİLİNÇLENME BİRLEŞTİRME BÜYÜKELÇİLİK",
    "CUMHURİYET ÇALIŞKANLIK ÇEKİRDEKLİ ÇEVREDOSTU ÇÖZÜMLEME DAYANIŞMA DEĞERLENDİR DEĞİŞİKLİK DEMOKRATİK DENETLEMEK DESTEKLEME DİKKATLİCE DÜZENLEMEK",
    "ELEKTRONİK ENDÜSTRİYEL ENGELLENME FARKINDALIK FEDAKARLIK GELENEKSEL GELİŞTİRME GERÇEKLEŞME GÖSTERİŞLİ GÜZELLEŞME HABERLEŞME HAREKETLİLİK HESAPLAMAK HIZLANDIRMA",
    "İLERLETMEK İMPARATORLUK İNSANLIKLI İSTATİSTİK İŞLETMECİLİK İYİLEŞTİRME KARŞILAŞMA KEŞFEDİLME KÜTÜPHANECİ MATEMATİKSEL MEMNUNİYET MÜHENDİSLİK MÜKEMMELLİK",
    "OLAĞANÜSTÜ ORGANİZASYON ÖĞRETMENLİK ÖZGÜRLÜKÇÜ PAZARLAMA PERFORMANS PROFESYONEL PROGRAMLAMA PSİKOLOJİK RAHATSIZLIK RESTORASYON SAĞLAMLAŞMA SORUMLULUK TEKNOLOJİK TELEVİZYON ÜNİVERSİTELİ VATANDAŞLIK YARDIMSEVER YÖNETİCİLİK ZENGİNLEŞME"
].join(" ");
var WORDS_BY_LENGTH = {
    3: new Array(),
    4: new Array(),
    5: new Array(),
    6: new Array(),
    7: new Array(),
    8: new Array(),
    9: new Array(),
    10: new Array()
};
var ALL_VALID_WORDS = new Set();
var ALL_WORDS_SORTED = [];
var activeDictionaryLength = 0;
var dictionaryPage = 0;
var DICTIONARY_PAGE_SIZE = 250;

function initDictionary() {
    var extraWords = typeof EXTRA_WORDS !== "undefined" ? EXTRA_WORDS.join(" ") : "";
    var tokens = (RAW_WORDS + " " + extraWords).trim().split(/\s+/);
    var allowedLetters = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
    tokens.forEach(function (w) {
        var clean = w.trim().toLocaleUpperCase("tr-TR");
        var len = clean.length;
        var isValid = len >= 3 && len <= 10;
        if (isValid) {
            for (var i = 0; i < clean.length; i++) {
                if (allowedLetters.indexOf(clean[i]) === -1) {
                    isValid = false;
                    break;
                }
            }
        }
        if (isValid && !ALL_VALID_WORDS.has(clean)) {
            ALL_VALID_WORDS.add(clean);
            WORDS_BY_LENGTH[len].push(clean);
        }
    });
    Object.keys(WORDS_BY_LENGTH).forEach(function (length) {
        WORDS_BY_LENGTH[length].sort(function (a, b) {
            return a.localeCompare(b, "tr-TR");
        });
    });
    ALL_WORDS_SORTED = Array.from(ALL_VALID_WORDS).sort(function (a, b) {
        return a.localeCompare(b, "tr-TR");
    });
}
initDictionary();

var LEVEL_PROGRESSION = new Array(3, 4, 5, 6, 7, 8, 9, 10);
var MAX_ATTEMPTS = 6;

var currentLevelIndex = 0;
var score = 0;
var targetWord = "";
var wordLength = 3;
var currentRow = 0;
var currentTile = 0;
var guesses = new Array();
var isGameOver = false;
var isChecking = false;
var usedWords = new Set();

var TURKISH_KEYBOARD = new Array(
    new Array("E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"),
    new Array("A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"),
    new Array("ENTER", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "SİL")
);

function formatTime(sec) {
    var mins = Math.floor(sec / 60);
    var remSecs = sec % 60;
    var mStr = mins < 10 ? "0" + mins : "" + mins;
    var sStr = remSecs < 10 ? "0" + remSecs : "" + remSecs;
    return mStr + ":" + sStr;
}

function startTimer() {
    stopTimer();
    elapsedSeconds = 0;
    var timerEl = document.getElementById("timer-display");
    if (timerEl) timerEl.textContent = "⏱️ 00:00";
    timerInterval = setInterval(function () {
        elapsedSeconds++;
        if (timerEl) timerEl.textContent = "⏱️ " + formatTime(elapsedSeconds);
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(function (s) {
        s.classList.remove("active");
    });
    document.getElementById(screenId).classList.add("active");
}

function exitToHub(event) {
    if (event) event.preventDefault();
    if (typeof SoundEngine !== "undefined") {
        SoundEngine.playStartClick();
    }
    window.setTimeout(function () {
        window.location.assign("/");
    }, 500);
}
function returnToMenu() {
    stopTimer();
    if (typeof SoundEngine !== "undefined") {
        SoundEngine.playButton();
    }
    showScreen("menu-screen");
    if (typeof SoundEngine !== "undefined") {
        SoundEngine.playMenuMusic();
    }
}

function startGame() {
    currentLevelIndex = 0;
    score = 0;
    usedWords.clear();
    if (typeof SoundEngine !== "undefined") {
        SoundEngine.playStartClick();
        SoundEngine.playGameMusic();
    }
    showScreen("game-screen");
    setupLevel();
}

function goToNextLevel() {
    currentLevelIndex++;
    if (typeof SoundEngine !== "undefined") {
        SoundEngine.playButton();
        SoundEngine.playGameMusic();
    }
    showScreen("game-screen");
    setupLevel();
}

function setupLevel() {
    isGameOver = false;
    isChecking = false;
    currentRow = 0;
    currentTile = 0;
    attemptHistory = new Array();
    wordLength = LEVEL_PROGRESSION[currentLevelIndex];
    guesses = Array(MAX_ATTEMPTS).fill().map(function () {
        return Array(wordLength).fill("");
    });

    var pool = WORDS_BY_LENGTH[wordLength];
    var candidate = pool[Math.floor(Math.random() * pool.length)];
    var safety = 0;
    while (usedWords.has(candidate) && safety < 200) {
        candidate = pool[Math.floor(Math.random() * pool.length)];
        safety++;
    }
    usedWords.add(candidate);
    targetWord = candidate;

    document.getElementById("level-display").textContent = "Bölüm " + (currentLevelIndex + 1) + " / " + LEVEL_PROGRESSION.length + " (" + wordLength + " Harf)";
    document.getElementById("score-display").textContent = "Puan: " + score;

    renderBoard();
    renderKeyboard();
    startTimer();
}

function renderBoard() {
    var board = document.getElementById("board-container");
    board.innerHTML = "";

    var boxSize = 48;
    var fontSize = "1.6rem";
    if (wordLength >= 9) {
        boxSize = 32;
        fontSize = "1.05rem";
    } else if (wordLength >= 7) {
        boxSize = 38;
        fontSize = "1.25rem";
    } else if (wordLength === 6) {
        boxSize = 42;
        fontSize = "1.4rem";
    }

    for (var r = 0; r < MAX_ATTEMPTS; r++) {
        var rowEl = document.createElement("div");
        rowEl.className = "row";
        rowEl.id = "row-" + r;

        for (var c = 0; c < wordLength; c++) {
            var tileEl = document.createElement("div");
            tileEl.className = "tile";
            tileEl.style.width = boxSize + "px";
            tileEl.style.height = boxSize + "px";
            tileEl.style.fontSize = fontSize;
            tileEl.id = "tile-" + r + "-" + c;
            rowEl.appendChild(tileEl);
        }
        board.appendChild(rowEl);
    }
}
function renderKeyboard() {
    var kb = document.getElementById("keyboard");
    kb.innerHTML = "";

    TURKISH_KEYBOARD.forEach(function (rowKeys) {
        var rowEl = document.createElement("div");
        rowEl.className = "kb-row";

        rowKeys.forEach(function (key) {
            var btn = document.createElement("button");
            btn.className = "key" + (key === "ENTER" || key === "SİL" ? " wide" : "");
            btn.textContent = key;
            btn.dataset.key = key;
            btn.onclick = function () {
                handleKeyInput(key);
            };
            rowEl.appendChild(btn);
        });

        kb.appendChild(rowEl);
    });
}

function showToast(msg, duration) {
    if (!duration) duration = 1800;
    var toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(function () {
        toast.classList.remove("show");
    }, duration);
}

function handleKeyInput(key) {
    if (isGameOver || isChecking) return;
    var allowedLetters = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";

    if (key === "SİL" || key === "BACKSPACE") {
        deleteLetter();
    } else if (key === "ENTER") {
        submitGuess();
    } else if (key.length === 1 && allowedLetters.indexOf(key) !== -1) {
        addLetter(key);
    }
}

function addLetter(letter) {
    if (currentTile < wordLength) {
        guesses[currentRow][currentTile] = letter;
        var tile = document.getElementById("tile-" + currentRow + "-" + currentTile);
        tile.textContent = letter;
        tile.classList.add("filled");
        currentTile++;
        if (typeof SoundEngine !== "undefined") {
            SoundEngine.playType();
        }

        if (currentTile === wordLength) {
            isChecking = true;
            setTimeout(function () {
                submitGuess();
            }, 220);
        }
    }
}

function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        guesses[currentRow][currentTile] = "";
        var tile = document.getElementById("tile-" + currentRow + "-" + currentTile);
        tile.textContent = "";
        tile.classList.remove("filled");
        if (typeof SoundEngine !== "undefined") {
            SoundEngine.playDelete();
        }
    }
}

function shakeCurrentRow() {
    var rowEl = document.getElementById("row-" + currentRow);
    if (rowEl) {
        rowEl.classList.remove("shake");
        void rowEl.offsetWidth;
        rowEl.classList.add("shake");
    }
}

function submitGuess() {
    if (currentTile < wordLength) {
        isChecking = false;
        if (typeof SoundEngine !== "undefined") {
            SoundEngine.playError();
        }
        showToast("Lütfen " + wordLength + " harfli bir kelime girin!");
        shakeCurrentRow();
        return;
    }

    if (typeof SoundEngine !== "undefined") {
        SoundEngine.playEnter();
    }
    var guessWord = guesses[currentRow].join("");

    if (!ALL_VALID_WORDS.has(guessWord)) {
        isChecking = false;
        if (typeof SoundEngine !== "undefined") {
            SoundEngine.playError();
        }
        showToast("Böyle kelime yok!");
        shakeCurrentRow();
        return;
    }

    evaluateGuess(guessWord);
}

function evaluateGuess(guessWord) {
    var targetArr = targetWord.split("");
    var guessArr = guessWord.split("");
    var statuses = Array(wordLength).fill("absent");
    var targetLetterCounts = {};

    for (var k = 0; k < wordLength; k++) {
        var char = targetArr[k];
        targetLetterCounts[char] = (targetLetterCounts[char] || 0) + 1;
    }

    for (var i = 0; i < wordLength; i++) {
        if (guessArr[i] === targetArr[i]) {
            statuses[i] = "correct";
            targetLetterCounts[guessArr[i]]--;
        }
    }

    for (var i = 0; i < wordLength; i++) {
        if (statuses[i] !== "correct") {
            var letter = guessArr[i];
            if (targetLetterCounts[letter] && targetLetterCounts[letter] > 0) {
                statuses[i] = "present";
                targetLetterCounts[letter]--;
            }
        }
    }

    attemptHistory.push({
        word: guessArr,
        statuses: statuses
    });

    for (var i = 0; i < wordLength; i++) {
        if (typeof SoundEngine !== "undefined") {
            var soundDelay = i * 0.055;
            if (statuses[i] === "correct") SoundEngine.playGreen(soundDelay);
            else if (statuses[i] === "present") SoundEngine.playYellow(soundDelay);
            else SoundEngine.playAbsent(soundDelay);
        }
        var tile = document.getElementById("tile-" + currentRow + "-" + i);
        tile.classList.add(statuses[i]);
        updateKeyboardKey(guessArr[i], statuses[i]);
    }

    if (guessWord === targetWord) {
        isGameOver = true;
        isChecking = false;
        stopTimer();
        var earnedPoints = (MAX_ATTEMPTS - currentRow) * wordLength * 10;
        score += earnedPoints;
        document.getElementById("score-display").textContent = "Puan: " + score;

        setTimeout(function () {
            if (currentLevelIndex + 1 < LEVEL_PROGRESSION.length) {
                showLevelWinScreen(currentRow + 1);
            } else {
                endGame(true);
            }
        }, 800);
    } else {
        currentRow++;
        currentTile = 0;
        isChecking = false;

        if (currentRow >= MAX_ATTEMPTS) {
            isGameOver = true;
            stopTimer();
            setTimeout(function () {
                endGame(false);
            }, 800);
        }
    }
}

function renderHistoryBoard(containerId) {
    var container = document.getElementById(containerId);
    container.innerHTML = "";
    attemptHistory.forEach(function (item) {
        var rowDiv = document.createElement("div");
        rowDiv.className = "history-row";
        for (var i = 0; i < item.word.length; i++) {
            var box = document.createElement("div");
            box.className = "history-tile " + item.statuses[i];
            box.textContent = item.word[i];
            rowDiv.appendChild(box);
        }
        container.appendChild(rowDiv);
    });
}

function showLevelWinScreen(attemptCount) {
    showScreen("level-win-screen");
    if (typeof SoundEngine !== "undefined") {
        SoundEngine.stopAllMusic();
        SoundEngine.playLevelUp();
    }
    document.getElementById("win-subtitle").textContent = (currentLevelIndex + 1) + ". Bölümü tamamladınız!";
    document.getElementById("win-word-info").innerHTML = 'Bulunan Kelime: <strong style="color:#538d4e">"' + targetWord + '"</strong>';
    document.getElementById("win-attempt-info").textContent = "Kaçıncı Denemede Buldun: " + attemptCount + ". deneme";
    document.getElementById("win-time-info").textContent = "Geçen Süre: " + formatTime(elapsedSeconds);
    renderHistoryBoard("win-history-board");
}

function updateKeyboardKey(letter, status) {
    var keyBtn = document.querySelector(".key[data-key='" + letter + "']");
    if (!keyBtn) return;

    if (status === "correct") {
        keyBtn.classList.remove("present", "absent");
        keyBtn.classList.add("correct");
    } else if (status === "present" && !keyBtn.classList.contains("correct")) {
        keyBtn.classList.remove("absent");
        keyBtn.classList.add("present");
    } else if (status === "absent" && !keyBtn.classList.contains("correct") && !keyBtn.classList.contains("present")) {
        keyBtn.classList.add("absent");
    }
}

function endGame(isVictory) {
    showScreen("end-screen");
    if (typeof SoundEngine !== "undefined") {
        if (isVictory) SoundEngine.playWin();
        else SoundEngine.playLose();
    }
    var titleEl = document.getElementById("end-title");
    var subEl = document.getElementById("end-subtitle");
    var wordInfo = document.getElementById("end-word-info");
    var levelInfo = document.getElementById("end-level-info");
    var timeInfo = document.getElementById("end-time-info");
    var scoreInfo = document.getElementById("end-score-info");

    if (isVictory) {
        titleEl.textContent = "AFERİN - OYUN BİTTİ!";
        titleEl.style.background = "linear-gradient(45deg, #538d4e, #8bc34a)";
        titleEl.style.backgroundClip = "text";
        titleEl.style.webkitBackgroundClip = "text";
        subEl.textContent = "3 harften 10 harfe kadar tüm bölümleri bitirdiniz!";
        wordInfo.innerHTML = 'Son Kelime: <strong style="color:#538d4e">"' + targetWord + '"</strong>';
        levelInfo.textContent = "Tamamlanan Bölüm: " + LEVEL_PROGRESSION.length + " / " + LEVEL_PROGRESSION.length;
    } else {
        titleEl.textContent = "BİLEMEDİN!";
        titleEl.style.background = "linear-gradient(45deg, #e53935, #ff7043)";
        titleEl.style.backgroundClip = "text";
        titleEl.style.webkitBackgroundClip = "text";
        subEl.textContent = "Tahmin hakkınız doldu.";
        wordInfo.innerHTML = 'Doğru Kelime: <strong style="color:#b59f3b">"' + targetWord + '"</strong>';
        levelInfo.textContent = "Ulaşılan Bölüm: " + (currentLevelIndex + 1) + " / " + LEVEL_PROGRESSION.length;
    }

    timeInfo.textContent = "Son Bölüm Süresi: " + formatTime(elapsedSeconds);
    scoreInfo.textContent = "Toplam Puanınız: " + score;
    renderHistoryBoard("end-history-board");
}

document.addEventListener("keydown", function (e) {
    if (!document.getElementById("game-screen").classList.contains("active")) return;

    if (e.key === "Enter") {
        handleKeyInput("ENTER");
    } else if (e.key === "Backspace") {
        handleKeyInput("SİL");
    } else if (e.key.length === 1) {
        var upper = e.key.toLocaleUpperCase("tr-TR");
        handleKeyInput(upper);
    }
});
// --- SÖZLÜK EKRANI YÖNETİMİ ---
function openDictionary() {
    if (typeof SoundEngine !== "undefined") {
        SoundEngine.playButton();
    }
    var searchEl = document.getElementById("dict-search");
    if (searchEl) searchEl.value = "";
    showScreen("dict-screen");
    renderDictionaryTabs(0);
}

function closeDictionary() {
    if (typeof SoundEngine !== "undefined") {
        SoundEngine.playButton();
    }
    showScreen("menu-screen");
}

function renderDictionaryTabs(activeLength) {
    activeDictionaryLength = activeLength;
    dictionaryPage = 0;
    var tabsContainer = document.getElementById("dict-tabs");
    tabsContainer.innerHTML = "";
    var choices = [{ length: 0, label: "Tümü" }];
    for (var len = 3; len <= 10; len++) {
        choices.push({ length: len, label: len + " Harf" });
    }

    choices.forEach(function (choice) {
        var btn = document.createElement("button");
        btn.className = "dict-tab" + (choice.length === activeLength ? " active" : "");
        btn.textContent = choice.label;
        btn.onclick = function () {
            if (typeof SoundEngine !== "undefined") {
                SoundEngine.playType();
            }
            renderDictionaryTabs(choice.length);
        };
        tabsContainer.appendChild(btn);
    });

    renderDictionaryWords(activeLength);
}

function changeDictionaryPage(delta) {
    dictionaryPage = Math.max(0, dictionaryPage + delta);
    renderDictionaryWords(activeDictionaryLength);
}

function renderDictionaryWords(length) {
    var grid = document.getElementById("dict-word-grid");
    var info = document.getElementById("dict-count-info");
    var pagination = document.getElementById("dict-pagination");
    var searchEl = document.getElementById("dict-search");
    var query = searchEl ? searchEl.value.trim().toLocaleUpperCase("tr-TR") : "";
    var list = length === 0 ? ALL_WORDS_SORTED : (WORDS_BY_LENGTH[length] || []);

    if (query) {
        list = list.filter(function (word) {
            return word.indexOf(query) !== -1;
        });
    }

    var totalPages = Math.max(1, Math.ceil(list.length / DICTIONARY_PAGE_SIZE));
    dictionaryPage = Math.min(dictionaryPage, totalPages - 1);
    var startIndex = dictionaryPage * DICTIONARY_PAGE_SIZE;
    var visibleWords = list.slice(startIndex, startIndex + DICTIONARY_PAGE_SIZE);
    var listLabel = length === 0 ? "Tüm kelimeler" : length + " harfli kelimeler";
    info.textContent = listLabel + (query ? ' — “' + query + '” araması' : "") + " · " + list.length.toLocaleString("tr-TR") + " kelime";

    grid.innerHTML = "";
    visibleWords.forEach(function (word) {
        var chip = document.createElement("span");
        chip.className = "dict-word-chip";
        chip.textContent = word;
        grid.appendChild(chip);
    });

    pagination.innerHTML = "";
    if (totalPages > 1) {
        var previous = document.createElement("button");
        previous.className = "dict-page-btn";
        previous.textContent = "← Önceki";
        previous.disabled = dictionaryPage === 0;
        previous.onclick = function () { changeDictionaryPage(-1); };

        var pageInfo = document.createElement("span");
        pageInfo.className = "dict-page-info";
        pageInfo.textContent = (dictionaryPage + 1).toLocaleString("tr-TR") + " / " + totalPages.toLocaleString("tr-TR");

        var next = document.createElement("button");
        next.className = "dict-page-btn";
        next.textContent = "Sonraki →";
        next.disabled = dictionaryPage >= totalPages - 1;
        next.onclick = function () { changeDictionaryPage(1); };

        pagination.appendChild(previous);
        pagination.appendChild(pageInfo);
        pagination.appendChild(next);
    }
}
