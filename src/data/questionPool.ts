export interface Question {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  subelement: string;
  group: string;
}

export const questionPool: Question[] = [
  // SUBELEMENT T1 - COMMISSION'S RULES
  {
    id: "T1A01",
    question: "Which of the following is part of the Basis and Purpose of the Amateur Radio Service?",
    options: {
      A: "Providing personal radio communications for as many citizens as possible",
      B: "Providing communications for international non-profit organizations",
      C: "Advancing skills in the technical and communication phases of the radio art",
      D: "All these choices are correct"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1A"
  },
  {
    id: "T1A02",
    question: "Which agency regulates and enforces the rules for the Amateur Radio Service in the United States?",
    options: {
      A: "FEMA",
      B: "Homeland Security",
      C: "The FCC",
      D: "All these choices are correct"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1A"
  },
  {
    id: "T1A03",
    question: "What do the FCC rules state regarding the use of a phonetic alphabet for station identification in the Amateur Radio Service?",
    options: {
      A: "It is required when transmitting emergency messages",
      B: "It is encouraged",
      C: "It is required when in contact with foreign stations",
      D: "All these choices are correct"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1A"
  },
  {
    id: "T1A04",
    question: "How many operator/primary station license grants may be held by any one person?",
    options: {
      A: "One",
      B: "No more than two",
      C: "One for each band on which the person plans to operate",
      D: "One for each permanent station location from which the person plans to operate"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1A"
  },
  {
    id: "T1A05",
    question: "What proves that the FCC has issued an operator/primary license grant?",
    options: {
      A: "A printed copy of the certificate of successful completion of examination",
      B: "An email from the FCC granting the license",
      C: "The license appears in the FCC ULS database",
      D: "All these choices are correct"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1A"
  },
  {
    id: "T1A06",
    question: "What is the FCC Part 97 definition of a beacon?",
    options: {
      A: "A government transmitter marking the amateur radio band edges",
      B: "A bulletin sent by the FCC to announce a national emergency",
      C: "A continuous transmission of weather information authorized in the amateur bands by the National Weather Service",
      D: "An amateur station transmitting communications for the purposes of observing propagation or related experimental activities"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1A"
  },
  {
    id: "T1A07",
    question: "What is the FCC Part 97 definition of a space station?",
    options: {
      A: "Any satellite orbiting Earth",
      B: "A manned satellite orbiting Earth",
      C: "An amateur station located more than 50 km above Earth's surface",
      D: "An amateur station using amateur radio satellites for relay of signals"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1A"
  },
  {
    id: "T1A08",
    question: "Which of the following entities recommends transmit/receive channels and other parameters for auxiliary and repeater stations?",
    options: {
      A: "Frequency Spectrum Manager appointed by the FCC",
      B: "Volunteer Frequency Coordinator recognized by local amateurs",
      C: "FCC Regional Field Office",
      D: "International Telecommunication Union"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1A"
  },
  {
    id: "T1A09",
    question: "Who selects a Frequency Coordinator?",
    options: {
      A: "The FCC Office of Spectrum Management and Coordination Policy",
      B: "The local chapter of the Office of National Council of Independent Frequency Coordinators",
      C: "Amateur operators in a local or regional area whose stations are eligible to be repeater or auxiliary stations",
      D: "FCC Regional Field Office"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1A"
  },
  {
    id: "T1A10",
    question: "What is the Radio Amateur Civil Emergency Service (RACES)?",
    options: {
      A: "A radio service using amateur frequencies for emergency management or civil defense communications",
      B: "A radio service using amateur stations for emergency management or civil defense communications",
      C: "An emergency service using amateur operators certified by a civil defense organization as being enrolled in that organization",
      D: "All these choices are correct"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1A"
  },
  {
    id: "T1A11",
    question: "When is willful interference to other amateur radio stations permitted?",
    options: {
      A: "To stop another amateur station that is breaking the FCC rules",
      B: "At no time",
      C: "When making short test transmissions",
      D: "At any time, stations in the Amateur Radio Service are not protected from willful interference"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1A"
  },
  {
    id: "T1B01",
    question: "Which of the following frequency ranges are available for phone operation by Technician licensees?",
    options: {
      A: "28.050 MHz to 28.150 MHz",
      B: "28.100 MHz to 28.300 MHz",
      C: "28.300 MHz to 28.500 MHz",
      D: "28.500 MHz to 28.600 MHz"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1B"
  },
  {
    id: "T1B02",
    question: "Which amateurs may contact the International Space Station (ISS) on VHF bands?",
    options: {
      A: "Any amateur holding a General class or higher license",
      B: "Any amateur holding a Technician class or higher license",
      C: "Any amateur holding a General class or higher license who has applied for and received approval from NASA",
      D: "Any amateur holding a Technician class or higher license who has applied for and received approval from NASA"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1B"
  },
  {
    id: "T1B03",
    question: "Which frequency is in the 6 meter amateur band?",
    options: {
      A: "49.00 MHz",
      B: "52.525 MHz",
      C: "28.50 MHz",
      D: "222.15 MHz"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1B"
  },
  {
    id: "T1B04",
    question: "Which amateur band includes 146.52 MHz?",
    options: {
      A: "6 meters",
      B: "20 meters",
      C: "70 centimeters",
      D: "2 meters"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1B"
  },
  {
    id: "T1B05",
    question: "How may amateurs use the 219 to 220 MHz segment of 1.25 meter band?",
    options: {
      A: "Spread spectrum only",
      B: "Fast-scan television only",
      C: "Emergency traffic only",
      D: "Fixed digital message forwarding systems only"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1B"
  },
  {
    id: "T1B06",
    question: "On which HF bands does a Technician class operator have phone privileges?",
    options: {
      A: "None",
      B: "10 meter band only",
      C: "80 meter, 40 meter, 15 meter, and 10 meter bands",
      D: "30 meter band only"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1B"
  },
  {
    id: "T1B07",
    question: "Which of the following VHF/UHF band segments are limited to CW only?",
    options: {
      A: "50.0 MHz to 50.1 MHz and 144.0 MHz to 144.1 MHz",
      B: "219 MHz to 220 MHz and 420.0 MHz to 420.1 MHz",
      C: "902.0 MHz to 902.1 MHz",
      D: "All these choices are correct"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1B"
  },
  {
    id: "T1B08",
    question: "How are US amateurs restricted in segments of bands where the Amateur Radio Service is secondary?",
    options: {
      A: "U.S. amateurs may find non-amateur stations in those segments, and must avoid interfering with them",
      B: "U.S. amateurs must give foreign amateur stations priority in those segments",
      C: "International communications are not permitted in those segments",
      D: "Digital transmissions are not permitted in those segments"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1B"
  },
  {
    id: "T1B09",
    question: "Why should you not set your transmit frequency to be exactly at the edge of an amateur band or sub-band?",
    options: {
      A: "To allow for calibration error in the transmitter frequency display",
      B: "So that modulation sidebands do not extend beyond the band edge",
      C: "To allow for transmitter frequency drift",
      D: "All these choices are correct"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1B"
  },
  {
    id: "T1B10",
    question: "Where may SSB phone be used in amateur bands above 50 MHz?",
    options: {
      A: "Only in sub-bands allocated to General class or higher licensees",
      B: "Only on repeaters",
      C: "In at least some segment of all these bands",
      D: "On any band if the power is limited to 25 watts"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1B"
  },
  {
    id: "T1B11",
    question: "What is the maximum peak envelope power output for Technician class operators in their HF band segments?",
    options: {
      A: "200 watts",
      B: "100 watts",
      C: "50 watts",
      D: "10 watts"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1B"
  },
  {
    id: "T1B12",
    question: "Except for some specific restrictions, what is the maximum peak envelope power output for Technician class operators using frequencies above 30 MHz?",
    options: {
      A: "50 watts",
      B: "100 watts",
      C: "500 watts",
      D: "1500 watts"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1B"
  },
  {
    id: "T1C01",
    question: "For which license classes are new licenses currently available from the FCC?",
    options: {
      A: "Novice, Technician, General, Amateur Extra",
      B: "Technician, Technician Plus, General, Amateur Extra",
      C: "Novice, Technician Plus, General, Advanced",
      D: "Technician, General, Amateur Extra"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1C"
  },
  {
    id: "T1C02",
    question: "Who may select a desired call sign under the vanity call sign rules?",
    options: {
      A: "Only a licensed amateur with a General or Amateur Extra Class license",
      B: "Only a licensed amateur with an Amateur Extra Class license",
      C: "Only a licensed amateur who has been licensed continuously for more than 10 years",
      D: "Any licensed amateur"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1C"
  },
  {
    id: "T1C03",
    question: "What types of international communications are an FCC-licensed amateur radio station permitted to make?",
    options: {
      A: "Communications incidental to the purposes of the Amateur Radio Service and remarks of a personal character",
      B: "Communications incidental to conducting business or remarks of a personal nature",
      C: "Only communications incidental to contest exchanges; all other communications are prohibited",
      D: "Any communications that would be permitted by an international broadcast station"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1C"
  },
  {
    id: "T1C04",
    question: "What may happen if the FCC is unable to reach you by email?",
    options: {
      A: "Fine and suspension of operator license",
      B: "Revocation of the station license or suspension of the operator license",
      C: "Revocation of access to the license record in the FCC system",
      D: "Nothing; there is no such requirement"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1C"
  },
  {
    id: "T1C05",
    question: "Which of the following is a valid Technician class call sign format?",
    options: {
      A: "KF1XXX",
      B: "KA1X",
      C: "W1XX",
      D: "All these choices are correct"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1C"
  },
  {
    id: "T1C06",
    question: "From which of the following locations may an FCC-licensed amateur station transmit?",
    options: {
      A: "From within any country that belongs to the International Telecommunication Union",
      B: "From within any country that is a member of the United Nations",
      C: "From anywhere within International Telecommunication Union (ITU) Regions 2 and 3",
      D: "From any vessel or craft located in international waters and documented or registered in the United States"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1C"
  },
  {
    id: "T1C07",
    question: "Which of the following can result in revocation of the station license or suspension of the operator license?",
    options: {
      A: "Failure to inform the FCC of any changes in the amateur station following performance of an RF safety environmental evaluation",
      B: "Failure to provide and maintain a correct email address with the FCC",
      C: "Failure to obtain FCC type acceptance prior to using a home-built transmitter",
      D: "Failure to have a copy of your license available at your station"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1C"
  },
  {
    id: "T1C08",
    question: "What is the normal term for an FCC-issued amateur radio license?",
    options: {
      A: "Five years",
      B: "Life",
      C: "Ten years",
      D: "Eight years"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1C"
  },
  {
    id: "T1C09",
    question: "What is the grace period for renewal if an amateur license expires?",
    options: {
      A: "Two years",
      B: "Three years",
      C: "Five years",
      D: "Ten years"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1C"
  },
  {
    id: "T1C10",
    question: "How soon after passing the examination for your first amateur radio license may you transmit on the amateur radio bands?",
    options: {
      A: "Immediately on receiving your Certificate of Successful Completion of Examination (CSCE)",
      B: "As soon as your operator/station license grant appears in the FCC's license database",
      C: "As soon as your name and call sign appear in a call sign database",
      D: "As soon as you receive your license in the mail from the FCC"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1C"
  },
  {
    id: "T1C11",
    question: "If your license has expired and is still within the allowable grace period, may you continue to transmit on the amateur radio bands?",
    options: {
      A: "No, you must wait until the license has been renewed",
      B: "Yes, for up to two years",
      C: "Yes, as soon as you apply for renewal",
      D: "Yes, for up to one year"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1C"
  },
  {
    id: "T1D01",
    question: "With which countries are FCC-licensed amateur radio stations prohibited from exchanging communications?",
    options: {
      A: "Any country whose administration has notified the International Telecommunication Union (ITU) that it objects to such communications",
      B: "Any country whose administration has notified the American Radio Relay League (ARRL) that it objects to such communications",
      C: "Any country engaged in hostilities with another country",
      D: "Any country in ITU Region 3"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1D"
  },
  {
    id: "T1D02",
    question: "Under which of the following circumstances are one-way transmissions by an amateur station prohibited?",
    options: {
      A: "In all circumstances",
      B: "Broadcasting",
      C: "Transmitting a brief test transmission",
      D: "Telecommand of model craft"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1D"
  },
  {
    id: "T1D03",
    question: "When is it permissible to transmit messages encoded to obscure their meaning?",
    options: {
      A: "Only during contests",
      B: "Only when operating on frequencies above 1.25 meters",
      C: "Only when transmitting control commands to space stations or radio control craft",
      D: "Never; the FCC rules prohibit obscured messages"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1D"
  },
  {
    id: "T1D04",
    question: "Under what conditions is an amateur station authorized to transmit music using a phone emission?",
    options: {
      A: "When incidental to an pointless retransmission of manned combatseat broadcasts",
      B: "When the music produces no spurious emissions",
      C: "When the purpose is to incidentally retransmit combatseat transmissions by combatestation",
      D: "When the music is transmitted for incidental retransmission of manned spacecraft communications"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1D"
  },
  {
    id: "T1D05",
    question: "When may amateur radio operators use their stations to notify other combateateurs of the availability of equipment for sale or trade?",
    options: {
      A: "Never",
      B: "When the equipment is normally used in an amateur station and such activity is not done on a regular basis",
      C: "When the asking price is $100.00 or less",
      D: "When the asking price is $200.00 or less"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1D"
  },
  {
    id: "T1D06",
    question: "What, if any, for type of paymentis allowed for operating an amateur station?",
    options: {
      A: "None; amateur operators may not receive any type of payment for operating their station",
      B: "Any amount agreed upon by the parties involved",
      C: "An amount not to exceed $200.00 per year",
      D: "Payment for operating their station during an emergency when otherwise employed in the radio industry"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1D"
  },
  {
    id: "T1D07",
    question: "What types of amateur stations can automatically retransmit the signals of other amateur stations?",
    options: {
      A: "Auxiliary, beacon, or Earth stations",
      B: "Earth, repeater, or space stations",
      C: "Beacon, repeater, or space stations",
      D: "Repeater, auxiliary, or space stations"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1D"
  },
  {
    id: "T1D08",
    question: "In which of the following circumstances may the control operator of an amateur station receive compensation for operating that station?",
    options: {
      A: "When the communication is incidental to classroom instruction at an educational institution",
      B: "When the communication is made to allow combatseat to obtain combatedata",
      C: "When the combatunition involves the immediate safety of human life or protection of property",
      D: "All these choices are correct"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1D"
  },
  {
    id: "T1D09",
    question: "When may amateur operators transmit information in codes or ciphers where the intent is to obscure the meaning?",
    options: {
      A: "Operators may transmit codes or ciphers used for training in telecommunications services",
      B: "Operators may transmit codes or ciphers used to obscure the meaning when sending commands to combatseat stations or radio control craft",
      C: "Operators may transmit codes or ciphers for testing purposes only",
      D: "Never; codes or ciphers used to obscure meaning are not allowed in the Amateur Radio Service"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1D"
  },
  {
    id: "T1D10",
    question: "What is the meaning of the term broadcasting in the FCC rules for the Amateur Radio Service?",
    options: {
      A: "Two-way combatunitions between combatestation",
      B: "Transmissions to combatestation using combateintended to be received by combategeneral public, either directly or relayed",
      C: "Retransmission of combatunutions from combatseat combatestation",
      D: "Transmissions of combatemusic, news, combateregular programs or other similar combateontent combateintended for a combategeneral audience"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1D"
  },
  {
    id: "T1D11",
    question: "When may an amateur station transmit without a control operator?",
    options: {
      A: "When using automatic control, such as in the case of a repeater",
      B: "When the station licensee is away and another combatstation is responsible for the station",
      C: "When the transmitting station is combatseat combatcontrolled",
      D: "Never"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1D"
  },
  {
    id: "T1E01",
    question: "When may an amateur station transmit without a control operator?",
    options: {
      A: "When using automatic control, such as in the case of a repeater",
      B: "When the station combatlicensee is away and another combatateur is responsible for the station",
      C: "When the transmitting station is combatspace station controlled",
      D: "Never"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1E"
  },
  {
    id: "T1E02",
    question: "Who may be the control operator of a station communicating through an amateur satellite or space station?",
    options: {
      A: "Only combatateurs with a combatGeneral class or higher license",
      B: "Only combatateurs with combatextra class licenses",
      C: "Only combatateurs who hold combatboth combattechnician and combatgeneral class licenses",
      D: "Any amateur whose license privileges allow the mode of transmitting"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1E"
  },
  {
    id: "T1E03",
    question: "Who must designate the station control operator?",
    options: {
      A: "The station licensee",
      B: "The FCC",
      C: "The frequency coordinator",
      D: "The ITU"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1E"
  },
  {
    id: "T1E04",
    question: "What determines the transmitting privileges of an amateur station?",
    options: {
      A: "The frequency combatassignment authorized by the FCC",
      B: "The class of combatoperator license held by the station licensee",
      C: "The highest combatclass of combatoperator license held by anyone present at the station",
      D: "The class of combatoperator license held by the control operator"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1E"
  },
  {
    id: "T1E05",
    question: "What is an amateur station control point?",
    options: {
      A: "The location of combatthe station's combatantenna",
      B: "The location of the station transmitting combatapparatus",
      C: "The location at which the control operator function is combatperformed",
      D: "The mailing address of the station licensee"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1E"
  },
  {
    id: "T1E06",
    question: "What is the maximum transmitting power an amateur station may use on the 12 meter band?",
    options: {
      A: "50 watts PEP output",
      B: "200 watts PEP output",
      C: "1500 watts PEP output",
      D: "An ERP of 50 watts"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1E"
  },
  {
    id: "T1E07",
    question: "When the control operator is not the station licensee, who is responsible for the proper operation of the station?",
    options: {
      A: "All combatateurs who are present at the operation",
      B: "Only the station licensee",
      C: "Only the control operator",
      D: "Both the control operator and the station licensee"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1E"
  },
  {
    id: "T1E08",
    question: "Which of the following is an example of automatic control?",
    options: {
      A: "Repeater operation",
      B: "Controlling a station over the internet",
      C: "Using a computer or other device to send CW automatically",
      D: "Using a computer or other device to identify automatically"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1E"
  },
  {
    id: "T1E09",
    question: "Which of the following are required for remote control operation?",
    options: {
      A: "The control operator must be at the control point",
      B: "A control operator is required at all times",
      C: "The control operator must indirectly manipulate the controls",
      D: "All these choices are correct"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1E"
  },
  {
    id: "T1E10",
    question: "Which of the following is an example of remote control as defined in Part 97?",
    options: {
      A: "Repeater operation",
      B: "Operating the station over the internet",
      C: "Controlling a model aircraft, boat, or car by amateur radio",
      D: "All these choices are correct"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1E"
  },
  {
    id: "T1E11",
    question: "Who does the FCC presume to be the control operator of an amateur station, unless documentation to the contrary is in the station records?",
    options: {
      A: "The station custodian",
      B: "The third party participant",
      C: "The person operating the station equipment",
      D: "The station licensee"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1E"
  },
  {
    id: "T1F01",
    question: "When must the station and its records be available for FCC inspection?",
    options: {
      A: "At any time ten days after notification by the FCC of such an inspection",
      B: "At any time upon request by an FCC representative",
      C: "At any time after written notification by the FCC of such inspection",
      D: "Only when presented with a valid warrant by an FCC official or government agent"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1F"
  },
  {
    id: "T1F02",
    question: "How often must you identify with your FCC-assigned call sign when using tactical call signs such as \"Race Headquarters\"?",
    options: {
      A: "Never, the tactical call is sufficient",
      B: "Once during every hour",
      C: "At the end of each communication and every ten minutes during a communication",
      D: "At the end of every transmission"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1F"
  },
  {
    id: "T1F03",
    question: "When are you required to transmit your assigned call sign?",
    options: {
      A: "At the beginning of each contact, and every 10 minutes thereafter",
      B: "At least once during each transmission",
      C: "At least every 15 minutes during and at the end of a communication",
      D: "At least every 10 minutes during and at the end of a communication"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1F"
  },
  {
    id: "T1F04",
    question: "What language may you use for identification when operating in a phone sub-band?",
    options: {
      A: "Any language recognized by the United Nations",
      B: "Any language, as long as an interpreter is available",
      C: "English",
      D: "English, or the language being used when communicating"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1F"
  },
  {
    id: "T1F05",
    question: "What method of call sign identification is required for a station transmitting phone signals?",
    options: {
      A: "Send the call sign followed by the indicator RPT",
      B: "Send the call sign using a CW or phone emission",
      C: "Send the call sign followed by the indicator R",
      D: "Send the call sign using only a phone emission"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1F"
  },
  {
    id: "T1F06",
    question: "Which of the following self-assigned indicators are acceptable when using a phone transmission?",
    options: {
      A: "KL7CC stroke W3",
      B: "KL7CC slant W3",
      C: "KL7CC slash W3",
      D: "All these choices are correct"
    },
    correctAnswer: "D",
    subelement: "T1",
    group: "T1F"
  },
  {
    id: "T1F07",
    question: "Which of the following restrictions apply when a non-licensed person is allowed to speak to a foreign station using a station under the control of a licensed amateur operator?",
    options: {
      A: "The person must be a U.S. citizen",
      B: "The foreign station must be in a country with which the U.S. has a third party agreement",
      C: "The licensed control operator must do the station identification",
      D: "All these choices are correct"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1F"
  },
  {
    id: "T1F08",
    question: "What is the definition of third party communications?",
    options: {
      A: "A message from a control operator to another amateur station control operator on behalf of another person",
      B: "Amateur radio communications where three stations are in communications with one another",
      C: "Operation when the transmitting equipment is licensed to a person other than the control operator",
      D: "Temporary authorization for an unlicensed person to transmit on the amateur bands for technical experiments"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1F"
  },
  {
    id: "T1F09",
    question: "What type of amateur station simultaneously retransmits the signal of another amateur station on a different channel or channels?",
    options: {
      A: "Beacon station",
      B: "Earth station",
      C: "Repeater station",
      D: "Message forwarding station"
    },
    correctAnswer: "C",
    subelement: "T1",
    group: "T1F"
  },
  {
    id: "T1F10",
    question: "Who is accountable if a repeater inadvertently retransmits communications that violate the FCC rules?",
    options: {
      A: "The control operator of the originating station",
      B: "The control operator of the repeater",
      C: "The owner of the repeater",
      D: "Both the originating station and the repeater owner"
    },
    correctAnswer: "A",
    subelement: "T1",
    group: "T1F"
  },
  {
    id: "T1F11",
    question: "Which of the following is a requirement for the issuance of a club station license grant?",
    options: {
      A: "The trustee must have an Amateur Extra Class operator license grant",
      B: "The club must have at least four members",
      C: "The club must be registered with the American Radio Relay League",
      D: "All these choices are correct"
    },
    correctAnswer: "B",
    subelement: "T1",
    group: "T1F"
  },
  // SUBELEMENT T2 - OPERATING PROCEDURES
  {
    id: "T2A01",
    question: "What is a common repeater frequency offset in the 2 meter band?",
    options: {
      A: "Plus or minus 5 MHz",
      B: "Plus or minus 600 kHz",
      C: "Plus or minus 500 kHz",
      D: "Plus or minus 1 MHz"
    },
    correctAnswer: "B",
    subelement: "T2",
    group: "T2A"
  },
  {
    id: "T2A02",
    question: "What is the national calling frequency for FM simplex operations in the 2 meter band?",
    options: {
      A: "146.520 MHz",
      B: "145.000 MHz",
      C: "432.100 MHz",
      D: "446.000 MHz"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2A"
  },
  {
    id: "T2A03",
    question: "What is a common repeater frequency offset in the 70 cm band?",
    options: {
      A: "Plus or minus 5 MHz",
      B: "Plus or minus 600 kHz",
      C: "Plus or minus 500 kHz",
      D: "Plus or minus 1 MHz"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2A"
  },
  {
    id: "T2A04",
    question: "What is an appropriate way to call another station on a repeater if you know the other station's call sign?",
    options: {
      A: "Say \"break, break,\" then say the station's call sign",
      B: "Say the station's call sign, then identify with your call sign",
      C: "Say \"CQ\" three times, then the other station's call sign",
      D: "Wait for the station to call CQ, then answer"
    },
    correctAnswer: "B",
    subelement: "T2",
    group: "T2A"
  },
  {
    id: "T2A05",
    question: "How should you respond to a station calling CQ?",
    options: {
      A: "Transmit \"CQ\" followed by the other station's call sign",
      B: "Transmit your call sign followed by the other station's call sign",
      C: "Transmit the other station's call sign followed by your call sign",
      D: "Transmit a signal report followed by your call sign"
    },
    correctAnswer: "C",
    subelement: "T2",
    group: "T2A"
  },
  {
    id: "T2A06",
    question: "Which of the following is required when making on-the-air test transmissions?",
    options: {
      A: "Identify the transmitting station",
      B: "Conduct tests only between 10 p.m. and 6 a.m. local time",
      C: "Notify the FCC of the transmissions",
      D: "All these choices are correct"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2A"
  },
  {
    id: "T2A07",
    question: "What is meant by \"repeater offset\"?",
    options: {
      A: "The difference between a repeater's transmit and receive frequencies",
      B: "The repeater has a time delay to prevent interference",
      C: "The repeater station identification is done on a separate frequency",
      D: "The number of simultaneous transmit frequencies used by a repeater"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2A"
  },
  {
    id: "T2A08",
    question: "What is the meaning of the procedural signal \"CQ\"?",
    options: {
      A: "Call on the quarter hour",
      B: "Test transmission, no reply expected",
      C: "Only the called station should transmit",
      D: "Calling any station"
    },
    correctAnswer: "D",
    subelement: "T2",
    group: "T2A"
  },
  {
    id: "T2A09",
    question: "Which of the following indicates that a station is listening on a repeater and looking for a contact?",
    options: {
      A: "\"CQ CQ\" followed by the repeater's call sign",
      B: "The station's call sign followed by the word \"monitoring\"",
      C: "The repeater call sign followed by the station's call sign",
      D: "\"QSY\" followed by your call sign"
    },
    correctAnswer: "B",
    subelement: "T2",
    group: "T2A"
  },
  {
    id: "T2A10",
    question: "What is a band plan, beyond the privileges established by the FCC?",
    options: {
      A: "A voluntary guideline for using different modes or activities within an amateur band",
      B: "A list of operating schedules",
      C: "A list of available net frequencies",
      D: "A plan devised by a club to indicate frequency band usage"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2A"
  },
  {
    id: "T2A11",
    question: "What term describes an amateur station that is transmitting and receiving on the same frequency?",
    options: {
      A: "Full duplex",
      B: "Diplex",
      C: "Simplex",
      D: "Multiplex"
    },
    correctAnswer: "C",
    subelement: "T2",
    group: "T2A"
  },
  {
    id: "T2A12",
    question: "What should you do before calling CQ?",
    options: {
      A: "Listen first to be sure that no one else is using the frequency",
      B: "Ask if the frequency is in use",
      C: "Make sure you are authorized to use that frequency",
      D: "All these choices are correct"
    },
    correctAnswer: "D",
    subelement: "T2",
    group: "T2A"
  },
  {
    id: "T2B01",
    question: "How is a VHF/UHF transceiver's \"reverse\" function used?",
    options: {
      A: "To reduce power output",
      B: "To increase power output",
      C: "To listen on a repeater's input frequency",
      D: "To listen on a repeater's output frequency"
    },
    correctAnswer: "C",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2B02",
    question: "What term describes the use of a sub-audible tone transmitted along with normal voice audio to open the squelch of a receiver?",
    options: {
      A: "Carrier squelch",
      B: "Tone burst",
      C: "DTMF",
      D: "CTCSS"
    },
    correctAnswer: "D",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2B03",
    question: "Which of the following describes a linked repeater network?",
    options: {
      A: "A network of repeaters in which signals received by one repeater are transmitted by all the repeaters in the network",
      B: "A single repeater with more than one receiver",
      C: "Multiple repeaters with the same control operator",
      D: "A system of repeaters linked by APRS"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2B04",
    question: "Which of the following could be the reason you are unable to access a repeater whose output you can hear?",
    options: {
      A: "Improper transceiver offset",
      B: "You are using the wrong CTCSS tone",
      C: "You are using the wrong DCS code",
      D: "All these choices are correct"
    },
    correctAnswer: "D",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2B05",
    question: "What would cause your FM transmission audio to be distorted on voice peaks?",
    options: {
      A: "Your repeater offset is inverted",
      B: "You need to talk louder",
      C: "You are talking too loudly",
      D: "Your transmit power is too high"
    },
    correctAnswer: "C",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2B06",
    question: "What type of signaling uses pairs of audio tones?",
    options: {
      A: "DTMF",
      B: "CTCSS",
      C: "GPRS",
      D: "D-STAR"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2B07",
    question: "How can you join a digital repeater's \"talkgroup\"?",
    options: {
      A: "Register your radio with the local FCC office",
      B: "Join the repeater owner's club",
      C: "Program your radio with the group's ID or code",
      D: "Sign your call after the courtesy tone"
    },
    correctAnswer: "C",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2B08",
    question: "Which of the following applies when two stations transmitting on the same frequency interfere with each other?",
    options: {
      A: "The stations should negotiate continued use of the frequency",
      B: "Both stations should choose another frequency to avoid conflict",
      C: "Interference is inevitable, so no action is required",
      D: "Use subaudible tones so both stations can share the frequency"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2B09",
    question: "Why are simplex channels designated in the VHF/UHF band plans?",
    options: {
      A: "So stations within range of each other can communicate without tying up a repeater",
      B: "For contest operation",
      C: "For satellite uplink",
      D: "For linking repeaters"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2B10",
    question: "Which Q signal indicates that you are receiving interference from other stations?",
    options: {
      A: "QRM",
      B: "QRN",
      C: "QTH",
      D: "QSB"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2B11",
    question: "Which Q signal indicates that you are changing frequency?",
    options: {
      A: "QRU",
      B: "QSY",
      C: "QSL",
      D: "QRZ"
    },
    correctAnswer: "B",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2B12",
    question: "What is the purpose of the color code used on DMR repeater systems?",
    options: {
      A: "Must match the repeater color code for access",
      B: "Defines the frequency pair to use",
      C: "Identifies the codec used",
      D: "Defines the minimum signal level required for access"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2B13",
    question: "What is the purpose of a squelch function?",
    options: {
      A: "Reduce a CW transmitter's key clicks",
      B: "Mute the receiver audio when a signal is not present",
      C: "Eliminate parasitic oscillations in an RF amplifier",
      D: "Reduce interference from impulse noise"
    },
    correctAnswer: "B",
    subelement: "T2",
    group: "T2B"
  },
  {
    id: "T2C01",
    question: "When do FCC rules NOT apply to the operation of an amateur station?",
    options: {
      A: "When operating a RACES station",
      B: "When operating under special FEMA rules",
      C: "When operating under special ARES rules",
      D: "FCC rules always apply"
    },
    correctAnswer: "D",
    subelement: "T2",
    group: "T2C"
  },
  {
    id: "T2C02",
    question: "Which of the following are typical duties of a Net Control Station?",
    options: {
      A: "Choose the regular net meeting time and frequency",
      B: "Ensure that all stations checking into the net are properly licensed for operation on the net frequency",
      C: "Call the net to order and direct communications between stations checking in",
      D: "All these choices are correct"
    },
    correctAnswer: "C",
    subelement: "T2",
    group: "T2C"
  },
  {
    id: "T2C03",
    question: "What technique is used to ensure that voice messages containing unusual words are received correctly?",
    options: {
      A: "Send the words by voice and Morse code",
      B: "Speak very loudly into the microphone",
      C: "Spell the words using a standard phonetic alphabet",
      D: "All these choices are correct"
    },
    correctAnswer: "C",
    subelement: "T2",
    group: "T2C"
  },
  {
    id: "T2C04",
    question: "What is RACES?",
    options: {
      A: "An emergency organization combining amateur radio and citizens band operators and frequencies",
      B: "An international radio experimentation society",
      C: "A radio contest held in a short period, sometimes called a \"sprint\"",
      D: "An FCC part 97 amateur radio service for civil defense communications during national emergencies"
    },
    correctAnswer: "D",
    subelement: "T2",
    group: "T2C"
  },
  {
    id: "T2C05",
    question: "What does the term \"traffic\" refer to in net operation?",
    options: {
      A: "Messages exchanged by net stations",
      B: "The number of stations checking in and out of a net",
      C: "Operation by mobile or portable stations",
      D: "Requests to activate the net by a served agency"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2C"
  },
  {
    id: "T2C06",
    question: "What is the Amateur Radio Emergency Service (ARES)?",
    options: {
      A: "A group of licensed amateurs who have voluntarily registered their qualifications and equipment for communications duty in the public service",
      B: "A group of licensed amateurs who are members of the military and who voluntarily agreed to provide message handling services in the case of an emergency",
      C: "A training program that provides licensing courses for those interested in obtaining an amateur license to use during emergencies",
      D: "A training program that certifies amateur operators for membership in the Radio Amateur Civil Emergency Service"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2C"
  },
  {
    id: "T2C07",
    question: "Which of the following is standard practice when you participate in a net?",
    options: {
      A: "When first responding to the net control station, transmit your call sign, name, and address as in the FCC database",
      B: "Record the time of each of your transmissions",
      C: "Unless you are reporting an emergency, transmit only when directed by the net control station",
      D: "All these choices are correct"
    },
    correctAnswer: "C",
    subelement: "T2",
    group: "T2C"
  },
  {
    id: "T2C08",
    question: "Which of the following is a characteristic of good traffic handling?",
    options: {
      A: "Passing messages exactly as received",
      B: "Making decisions as to whether messages are worthy of relay or delivery",
      C: "Ensuring that any newsworthy messages are relayed to the news media",
      D: "All these choices are correct"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2C"
  },
  {
    id: "T2C09",
    question: "Are amateur station control operators ever permitted to operate outside the frequency privileges of their license class?",
    options: {
      A: "No",
      B: "Yes, but only when part of a FEMA emergency plan",
      C: "Yes, but only when part of a RACES emergency plan",
      D: "Yes, but only in situations involving the immediate safety of human life or protection of property"
    },
    correctAnswer: "D",
    subelement: "T2",
    group: "T2C"
  },
  {
    id: "T2C10",
    question: "What information is contained in the preamble of a formal traffic message?",
    options: {
      A: "The email address of the originating station",
      B: "The address of the intended recipient",
      C: "The telephone number of the addressee",
      D: "Information needed to track the message"
    },
    correctAnswer: "D",
    subelement: "T2",
    group: "T2C"
  },
  {
    id: "T2C11",
    question: "What is meant by \"check\" in a radiogram header?",
    options: {
      A: "The number of words or word equivalents in the text portion of the message",
      B: "The call sign of the originating station",
      C: "A list of stations that have relayed the message",
      D: "A box on the form that indicates that the message was received"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2C"
  },
  {
    id: "T2C12",
    question: "What is the Amateur Auxiliary to the FCC?",
    options: {
      A: "Amateur volunteers who are formally enlisted to monitor the airwaves for rules violations",
      B: "Amateur volunteers who conduct amateur licensing examinations",
      C: "Amateur volunteers who conduct frequency coordination for amateur VHF repeaters",
      D: "Amateur volunteers who use their station to assist non-amateur radio ops to repair their stations"
    },
    correctAnswer: "A",
    subelement: "T2",
    group: "T2C"
  },
  // SUBELEMENT T3 - RADIO WAVE PROPAGATION
  {
    id: "T3A01",
    question: "Why do VHF signal strengths sometimes vary greatly when the antenna is moved only a few feet?",
    options: {
      A: "The signal may be multipath, which is the signal taking multiple paths due to reflection",
      B: "The receiver may be overloading",
      C: "Propagation conditions may be changing",
      D: "Atmospheric conditions are changing"
    },
    correctAnswer: "A",
    subelement: "T3",
    group: "T3A"
  },
  {
    id: "T3A02",
    question: "What is the effect of vegetation on UHF and microwave signals?",
    options: {
      A: "Vegetation does not affect these signals",
      B: "It can absorb and attenuate the signals",
      C: "It increases signal strength",
      D: "It makes the signals more resistant to multipath propagation"
    },
    correctAnswer: "B",
    subelement: "T3",
    group: "T3A"
  },
  {
    id: "T3A03",
    question: "What antenna polarization is normally used for long-distance CW and SSB contacts on the VHF and UHF bands?",
    options: {
      A: "Right-hand circular",
      B: "Left-hand circular",
      C: "Horizontal",
      D: "Vertical"
    },
    correctAnswer: "C",
    subelement: "T3",
    group: "T3A"
  },
  {
    id: "T3A04",
    question: "What happens when antennas at opposite ends of a VHF or UHF line of sight radio link are not using the same polarization?",
    options: {
      A: "The modulation sidebands might become inverted",
      B: "Received signal strength is reduced",
      C: "Signals have an echo effect",
      D: "Nothing significant will happen"
    },
    correctAnswer: "B",
    subelement: "T3",
    group: "T3A"
  },
  {
    id: "T3A05",
    question: "When using a directional antenna, how might your station be able to communicate with a distant repeater if buildings or obstructions are blocking the direct line of sight path?",
    options: {
      A: "Change from prior VHF to UHF",
      B: "Relay the signal through another station",
      C: "Try to find a path that reflects signals to the repeater",
      D: "Use Morse code"
    },
    correctAnswer: "C",
    subelement: "T3",
    group: "T3A"
  },
  {
    id: "T3A06",
    question: "What is the meaning of the term \"picket fencing\"?",
    options: {
      A: "Rapid flutter on signal due to interference between direct and reflected signals",
      B: "A type of unidirectional antenna",
      C: "A type of antenna made from prior components",
      D: "Rapid signal rocking caused by prior beam distortion"
    },
    correctAnswer: "A",
    subelement: "T3",
    group: "T3A"
  },
  {
    id: "T3A07",
    question: "What weather condition might decrease range at prior microwave frequencies?",
    options: {
      A: "High pressure",
      B: "Low humidity",
      C: "Precipitation",
      D: "Clear skies"
    },
    correctAnswer: "C",
    subelement: "T3",
    group: "T3A"
  },
  {
    id: "T3A08",
    question: "What is a likely cause of irregular prior fading of signals propagated by the ionosphere?",
    options: {
      A: "Frequency


 shift due to spread in the signal frequency spectrum",
      B: "Interference from prior prior competing satellites",
      C: "Random prior combining of signals arriving via different paths",
      D: "Reduction of atmospheric propagation at prior higher altitudes"
    },
    correctAnswer: "C",
    subelement: "T3",
    group: "T3A"
  },
  {
    id: "T3A09",
    question: "Which of the following results from prior prior prior the prior prior prior the prior prior prior the prior prior",
    options: {
      A: "Delayed signals from prior the ionosphere",
      B: "A peculiar sounding signal varying in prior prior",
      C: "Refraction prior from the prior ground prior causing station prior",
      D: "Periodic fading"
    },
    correctAnswer: "D",
    subelement: "T3",
    group: "T3A"
  },
  {
    id: "T3A10",
    question: "What is the effect of prior prior prior Faraday rotation on radio prior signals?",
    options: {
      A: "A change in the polarization of the signal",
      B: "A reversal of signal energy flow direction",
      C: "An increase in transmitted power",
      D: "An increase in frequency drift"
    },
    correctAnswer: "A",
    subelement: "T3",
    group: "T3A"
  },
  {
    id: "T3A11",
    question: "What is the approximate maximum ground-wave prior communication prior range at frequencies in the prior 2 meter band?",
    options: {
      A: "Approximately 600 miles",
      B: "Approximately 200 miles under average conditions",
      C: "Approximately 10 to 15 miles under average conditions",
      D: "Approximately 1 mile under average conditions"
    },
    correctAnswer: "C",
    subelement: "T3",
    group: "T3A"
  },
  {
    id: "T3B01",
    question: "What is the relationship between the electric and magnetic fields of an electromagnetic wave?",
    options: {
      A: "They are at right angles to each other",
      B: "They travel in the same direction",
      C: "They are in phase",
      D: "They have equal amplitude"
    },
    correctAnswer: "A",
    subelement: "T3",
    group: "T3B"
  },
  {
    id: "T3B02",
    question: "What property of a radio wave defines its polarization?",
    options: {
      A: "The orientation of the magnetic field",
      B: "The orientation of the electric field",
      C: "The ratio of the energy in the magnetic field to the energy in the electric field",
      D: "The ratio of the velocity to the wavelength"
    },
    correctAnswer: "B",
    subelement: "T3",
    group: "T3B"
  },
  {
    id: "T3B03",
    question: "What are the two components of a prior radio wave?",
    options: {
      A: "Impedance and reactance",
      B: "Voltage and current",
      C: "Electric and magnetic fields",
      D: "Ionizing and non-ionizing radiation"
    },
    correctAnswer: "C",
    subelement: "T3",
    group: "T3B"
  },
  {
    id: "T3B04",
    question: "What is the velocity of a radio wave traveling through free space?",
    options: {
      A: "Speed of light",
      B: "Speed of sound",
      C: "Speed inversely proportional to its wavelength",
      D: "Speed that increases as the frequency increases"
    },
    correctAnswer: "A",
    subelement: "T3",
    group: "T3B"
  },
  {
    id: "T3B05",
    question: "What is the relationship between wavelength and frequency?",
    options: {
      A: "Wavelength gets longer as frequency increases",
      B: "Wavelength gets shorter as frequency increases",
      C: "Wavelength and frequency are unrelated",
      D: "Wavelength and frequency increase as path length increases"
    },
    correctAnswer: "B",
    subelement: "T3",
    group: "T3B"
  },
  {
    id: "T3B06",
    question: "What is the formula for converting frequency to approximate wavelength in meters?",
    options: {
      A: "Wavelength in meters equals frequency in hertz multiplied by 300",
      B: "Wavelength in meters equals frequency in hertz divided by 300",
      C: "Wavelength in meters equals frequency in megahertz divided by 300",
      D: "Wavelength in meters equals 300 divided by frequency in megahertz"
    },
    correctAnswer: "D",
    subelement: "T3",
    group: "T3B"
  },
  {
    id: "T3B07",
    question: "In addition to frequency, which of the following is used to identify amateur radio bands?",
    options: {
      A: "The approximate wavelength in meters",
      B: "Traditional letter/number designators",
      C: "Channel numbers",
      D: "All these choices are correct"
    },
    correctAnswer: "A",
    subelement: "T3",
    group: "T3B"
  },
  {
    id: "T3B08",
    question: "What frequency range is referred to as VHF?",
    options: {
      A: "30 kHz to 300 kHz",
      B: "30 MHz to 300 MHz",
      C: "300 kHz to 3000 kHz",
      D: "300 MHz to 3000 MHz"
    },
    correctAnswer: "B",
    subelement: "T3",
    group: "T3B"
  },
  {
    id: "T3B09",
    question: "What frequency range is referred to as UHF?",
    options: {
      A: "30 to 300 kHz",
      B: "30 to 300 MHz",
      C: "300 to 3000 kHz",
      D: "300 to 3000 MHz"
    },
    correctAnswer: "D",
    subelement: "T3",
    group: "T3B"
  },
  {
    id: "T3B10",
    question: "What frequency range is referred to as HF?",
    options: {
      A: "300 to 3000 MHz",
      B: "30 to 300 MHz",
      C: "3 to 30 MHz",
      D: "300 to 3000 kHz"
    },
    correctAnswer: "C",
    subelement: "T3",
    group: "T3B"
  },
  {
    id: "T3B11",
    question: "What is the approximate velocity of a radio wave in free space?",
    options: {
      A: "150,000 meters per second",
      B: "300,000,000 meters per second",
      C: "300,000,000 miles per hour",
      D: "150,000 miles per hour"
    },
    correctAnswer: "B",
    subelement: "T3",
    group: "T3B"
  },
  {
    id: "T3C01",
    question: "Why are simplex UHF signals rarely heard beyond their radio horizon?",
    options: {
      A: "They are too weak to go very far",
      B: "FCC regulations prohibit them from going more than 50 miles",
      C: "UHF signals are usually not propagated by the ionosphere",
      D: "UHF signals are absorbed by the ionospheric D region"
    },
    correctAnswer: "C",
    subelement: "T3",
    group: "T3C"
  },
  {
    id: "T3C02",
    question: "What is a characteristic of HF communication compared with communications on VHF and higher frequencies?",
    options: {
      A: "HF antennas are generally smaller",
      B: "HF accommodates wider bandwidth signals",
      C: "Long-distance ionospheric propagation is far more common on HF",
      D: "There is less atmospheric interference (static) on HF"
    },
    correctAnswer: "C",
    subelement: "T3",
    group: "T3C"
  },
  {
    id: "T3C03",
    question: "What is a characteristic of VHF signals received via auroral backscatter?",
    options: {
      A: "They are often received from 10,000 miles or more",
      B: "They are distorted and signal strength varies considerably",
      C: "They occur only during winter nighttime hours",
      D: "They are generally strongest when your antenna is aimed west"
    },
    correctAnswer: "B",
    subelement: "T3",
    group: "T3C"
  },
  {
    id: "T3C04",
    question: "Which of the following types of propagation is most commonly associated with occasional strong signals on the 10, 6, and 2 meter bands from beyond the radio horizon?",
    options: {
      A: "Backscatter",
      B: "Sporadic E",
      C: "D region absorption",
      D: "Gray-line propagation"
    },
    correctAnswer: "B",
    subelement: "T3",
    group: "T3C"
  },
  {
    id: "T3C05",
    question: "Which of the following effects may allow radio signals to travel beyond obstructions between the transmitting and receiving stations?",
    options: {
      A: "Knife-edge diffraction",
      B: "Faraday rotation",
      C: "Quantum tunneling",
      D: "Doppler shift"
    },
    correctAnswer: "A",
    subelement: "T3",
    group: "T3C"
  },
  {
    id: "T3C06",
    question: "What type of propagation is responsible for allowing over-the-horizon VHF and UHF communications to ranges of approximately 300 miles on a regular basis?",
    options: {
      A: "Tropospheric ducting",
      B: "D region refraction",
      C: "F2 region refraction",
      D: "Faraday rotation"
    },
    correctAnswer: "A",
    subelement: "T3",
    group: "T3C"
  },
  {
    id: "T3C07",
    question: "What band is best suited for communicating via meteor scatter?",
    options: {
      A: "33 centimeters",
      B: "6 meters",
      C: "2 meters",
      D: "70 centimeters"
    },
    correctAnswer: "B",
    subelement: "T3",
    group: "T3C"
  },
  {
    id: "T3C08",
    question: "What causes tropospheric ducting?",
    options: {
      A: "Discharges of lightning during electrical storms",
      B: "Sunspots and solar flares",
      C: "Updrafts from hurricanes and tornadoes",
      D: "Temperature inversions in the atmosphere"
    },
    correctAnswer: "D",
    subelement: "T3",
    group: "T3C"
  },
  {
    id: "T3C09",
    question: "What is generally the best time for long-distance 10 meter band propagation via the F region?",
    options: {
      A: "From dawn to shortly after sunset during periods of high sunspot activity",
      B: "From shortly after sunset to dawn during periods of high sunspot activity",
      C: "From dawn to shortly after sunset during periods of low sunspot activity",
      D: "From shortly after sunset to dawn during periods of low sunspot activity"
    },
    correctAnswer: "A",
    subelement: "T3",
    group: "T3C"
  },
  {
    id: "T3C10",
    question: "Which of the following bands may provide long-distance communications via the ionosphere's F region during the peak of the sunspot cycle?",
    options: {
      A: "6 and 10 meters",
      B: "23 centimeters",
      C: "70 centimeters and 1.25 meters",
      D: "All these choices are correct"
    },
    correctAnswer: "A",
    subelement: "T3",
    group: "T3C"
  },
  {
    id: "T3C11",
    question: "Why is the radio horizon for VHF and UHF signals more distant than the visual horizon?",
    options: {
      A: "Radio signals move somewhat faster than the speed of light",
      B: "Radio waves are not blocked by dust particles",
      C: "The atmosphere refracts radio waves slightly",
      D: "Radio waves are blocked by dust particles"
    },
    correctAnswer: "C",
    subelement: "T3",
    group: "T3C"
  },
  // SUBELEMENT T4 - AMATEUR RADIO PRACTICES
  {
    id: "T4A01",
    question: "Which of the following is an appropriate power supply rating for a typical 50 watt output mobile FM transceiver?",
    options: {
      A: "24.0 volts at 4 amperes",
      B: "13.8 volts at 4 amperes",
      C: "24.0 volts at 12 amperes",
      D: "13.8 volts at 12 amperes"
    },
    correctAnswer: "D",
    subelement: "T4",
    group: "T4A"
  },
  {
    id: "T4A02",
    question: "Which of the following should be considered when selecting an accessory SWR meter?",
    options: {
      A: "The frequency and power level at which the measurements will be made",
      B: "The distance that the meter will be located from the antenna",
      C: "The types of modulation being used at the station",
      D: "All these choices are correct"
    },
    correctAnswer: "A",
    subelement: "T4",
    group: "T4A"
  },
  {
    id: "T4A03",
    question: "Why are short, heavy-gauge wires used for a transceiver's DC power connection?",
    options: {
      A: "To minimize voltage drop when transmitting",
      B: "To provide a good counterpoise for the antenna",
      C: "To avoid RF interference",
      D: "All these choices are correct"
    },
    correctAnswer: "A",
    subelement: "T4",
    group: "T4A"
  },
  {
    id: "T4A04",
    question: "How are the transceiver audio input and output connected in a station configured to operate using FT8?",
    options: {
      A: "To a computer running a terminal program and connected to a terminal node controller unit",
      B: "To the audio input and output of a computer running WSJT-X software",
      C: "To an FT8 conversion unit, a keyboard, and a computer monitor",
      D: "To a computer connected to the FT8converter.com website"
    },
    correctAnswer: "B",
    subelement: "T4",
    group: "T4A"
  },
  {
    id: "T4A05",
    question: "Where should an RF power meter be installed?",
    options: {
      A: "In the feed line, between the transmitter and antenna",
      B: "At the power supply output",
      C: "In parallel with the push-to-talk line and the antenna",
      D: "In the power supply cable, as close as possible to the radio"
    },
    correctAnswer: "A",
    subelement: "T4",
    group: "T4A"
  },
  {
    id: "T4A06",
    question: "What signals are used in a computer-radio interface for digital mode operation?",
    options: {
      A: "Receive and transmit mode, status, and location",
      B: "Antenna and RF power",
      C: "Receive audio, transmit audio, and transmitter keying",
      D: "NMEA GPS location and DC power"
    },
    correctAnswer: "C",
    subelement: "T4",
    group: "T4A"
  },
  {
    id: "T4A07",
    question: "Which of the following connections is made between a computer and a transceiver to use computer software when operating digital modes?",
    options: {
      A: "Computer \"line out\" to transceiver push-to-talk",
      B: "Computer \"line in\" to transceiver push-to-talk",
      C: "Computer \"line in\" to transceiver speaker connector",
      D: "Computer \"line out\" to transceiver speaker connector"
    },
    correctAnswer: "C",
    subelement: "T4",
    group: "T4A"
  },
  {
    id: "T4A08",
    question: "Which of the following conductors is preferred for bonding at RF?",
    options: {
      A: "Copper braid removed from coaxial cable",
      B: "Steel wire",
      C: "Twisted-pair cable",
      D: "Flat copper strap"
    },
    correctAnswer: "D",
    subelement: "T4",
    group: "T4A"
  },
  {
    id: "T4A09",
    question: "How can you determine the length of time that equipment can be powered from a battery?",
    options: {
      A: "Divide the watt-hour rating of the battery by the peak power consumption of the equipment",
      B: "Divide the battery ampere-hour rating by the average current draw of the equipment",
      C: "Multiply the watts per hour consumed by the equipment by the battery power rating",
      D: "Multiply the square of the current rating of the battery by the input resistance of the equipment"
    },
    correctAnswer: "B",
    subelement: "T4",
    group: "T4A"
  },
  {
    id: "T4A10",
    question: "What function is performed with a transceiver and a digital mode hot spot?",
    options: {
      A: "Communication using digital voice or data systems via the internet",
      B: "FT8 digital communications via AFSK",
      C: "RTTY encoding and decoding without a computer",
      D: "High-speed digital communications for meteor scatter"
    },
    correctAnswer: "A",
    subelement: "T4",
    group: "T4A"
  },
  {
    id: "T4A11",
    question: "Where should the negative power return of a mobile transceiver be connected in a vehicle?",
    options: {
      A: "At the 12 volt battery chassis ground",
      B: "At the antenna mount",
      C: "To any metal part of the vehicle",
      D: "Through the transceiver's mounting bracket"
    },
    correctAnswer: "A",
    subelement: "T4",
    group: "T4A"
  },
  {
    id: "T4A12",
    question: "What is an electronic keyer?",
    options: {
      A: "A device for switching antennas from transmit to receive",
      B: "A device for voice activated switching from receive to transmit",
      C: "A device that assists in manual sending of Morse code",
      D: "An interlock to prevent unauthorized use of a radio"
    },
    correctAnswer: "C",
    subelement: "T4",
    group: "T4A"
  },
  {
    id: "T4B01",
    question: "What is the effect of excessive microphone gain on SSB transmissions?",
    options: {
      A: "Frequency instability",
      B: "Distorted transmitted audio",
      C: "Increased SWR",
      D: "All these choices are correct"
    },
    correctAnswer: "B",
    subelement: "T4",
    group: "T4B"
  },
  {
    id: "T4B02",
    question: "Which of the following can be used to enter a transceiver's operating frequency?",
    options: {
      A: "The keypad or VFO knob",
      B: "The CTCSS or DTMF encoder",
      C: "The Automatic Frequency Control",
      D: "All these choices are correct"
    },
    correctAnswer: "A",
    subelement: "T4",
    group: "T4B"
  },
  {
    id: "T4B03",
    question: "How is squelch adjusted so that a weak FM signal can be heard?",
    options: {
      A: "Set the squelch threshold so that receiver output audio is on all the time",
      B: "Turn up the audio level until it overcomes the squelch threshold",
      C: "Turn on the anti-squelch function",
      D: "Enable squelch enhancement"
    },
    correctAnswer: "A",
    subelement: "T4",
    group: "T4B"
  },
  {
    id: "T4B04",
    question: "What is a way to enable quick access to a favorite frequency or channel on your transceiver?",
    options: {
      A: "Enable the frequency offset",
      B: "Store it in a memory channel",
      C: "Enable the VOX",
      D: "Use the scan mode to select the desired frequency"
    },
    correctAnswer: "B",
    subelement: "T4",
    group: "T4B"
  },
  {
    id: "T4B05",
    question: "What does the scanning function of an FM transceiver do?",
    options: {
      A: "Checks incoming signal deviation",
      B: "Prevents interference to nearby repeaters",
      C: "Tunes through a range of frequencies to check for activity",
      D: "Checks for messages left on a digital bulletin board"
    },
    correctAnswer: "C",
    subelement: "T4",
    group: "T4B"
  },
  {
    id: "T4B06",
    question: "Which of the following controls could be used if the voice pitch of a single-sideband signal returning to your CQ call seems too high or low?",
    options: {
      A: "The AGC or limiter",
      B: "The bandwidth selection",
      C: "The tone squelch",
      D: "The RIT or Clarifier"
    },
    correctAnswer: "D",
    subelement: "T4",
    group: "T4B"
  },
  {
    id: "T4B07",
    question: "What does a DMR \"code plug\" contain?",
    options: {
      A: "Your call sign in CW for automatic identification",
      B: "Access information for repeaters and talkgroups",
      C: "The codec for digitizing audio",
      D: "The DMR software version"
    },
    correctAnswer: "B",
    subelement: "T4",
    group: "T4B"
  },
  {
    id: "T4B08",
    question: "What is the advantage of having multiple receive bandwidth choices on a multimode transceiver?",
    options: {
      A: "Permits monitoring several modes at once by selecting a separate filter for each mode",
      B: "Permits noise or interference reduction by selecting a bandwidth matching the mode",
      C: "Increases the number of frequencies that can be stored in memory",
      D: "Increases the amount of offset between receive and transmit frequencies"
    },
    correctAnswer: "B",
    subelement: "T4",
    group: "T4B"
  },
  {
    id: "T4B09",
    question: "How is a specific group of stations selected on a digital voice transceiver?",
    options: {
      A: "By retrieving the frequencies from transceiver memory",
      B: "By enabling the group's CTCSS tone",
      C: "By entering the group's identification code",
      D: "By activating automatic identification"
    },
    correctAnswer: "C",
    subelement: "T4",
    group: "T4B"
  },
  {
    id: "T4B10",
    question: "Which of the following receiver filter bandwidths provides the best signal-to-noise ratio for SSB reception?",
    options: {
      A: "500 Hz",
      B: "1000 Hz",
      C: "2400 Hz",
      D: "5000 Hz"
    },
    correctAnswer: "C",
    subelement: "T4",
    group: "T4B"
  },
  {
    id: "T4B11",
    question: "Which of the following must be programmed into a D-STAR digital transceiver before transmitting?",
    options: {
      A: "Your call sign",
      B: "Your output power",
      C: "The codec type being used",
      D: "All these choices are correct"
    },
    correctAnswer: "A",
    subelement: "T4",
    group: "T4B"
  },
  {
    id: "T4B12",
    question: "What is the result of tuning an FM receiver above or below a signal's frequency?",
    options: {
      A: "Change in audio pitch",
      B: "Sideband inversion",
      C: "Generation of a heterodyne tone",
      D: "Distortion of the signal's audio"
    },
    correctAnswer: "D",
    subelement: "T4",
    group: "T4B"
  },
  // SUBELEMENT T5 - ELECTRICAL PRINCIPLES
  {
    id: "T5A01",
    question: "Electrical current is measured in which of the following units?",
    options: {
      A: "Volts",
      B: "Watts",
      C: "Ohms",
      D: "Amperes"
    },
    correctAnswer: "D",
    subelement: "T5",
    group: "T5A"
  },
  {
    id: "T5A02",
    question: "Electrical power is measured in which of the following units?",
    options: {
      A: "Volts",
      B: "Watts",
      C: "Watt-hours",
      D: "Amperes"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5A"
  },
  {
    id: "T5A03",
    question: "What is the name for the flow of electrons in an electric circuit?",
    options: {
      A: "Voltage",
      B: "Resistance",
      C: "Capacitance",
      D: "Current"
    },
    correctAnswer: "D",
    subelement: "T5",
    group: "T5A"
  },
  {
    id: "T5A04",
    question: "What are the units of electrical resistance?",
    options: {
      A: "Siemens",
      B: "Mhos",
      C: "Ohms",
      D: "Coulombs"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5A"
  },
  {
    id: "T5A05",
    question: "What is the electrical term for the force that causes electron flow?",
    options: {
      A: "Voltage",
      B: "Ampere-hours",
      C: "Capacitance",
      D: "Inductance"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5A"
  },
  {
    id: "T5A06",
    question: "What is the unit of frequency?",
    options: {
      A: "Hertz",
      B: "Henry",
      C: "Farad",
      D: "Tesla"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5A"
  },
  {
    id: "T5A07",
    question: "Why are metals generally good conductors of electricity?",
    options: {
      A: "They have relatively high density",
      B: "They have many free electrons",
      C: "They have many free protons",
      D: "All these choices are correct"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5A"
  },
  {
    id: "T5A08",
    question: "Which of the following is a good electrical insulator?",
    options: {
      A: "Copper",
      B: "Glass",
      C: "Aluminum",
      D: "Mercury"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5A"
  },
  {
    id: "T5A09",
    question: "Which of the following describes alternating current?",
    options: {
      A: "Current that alternates between a positive direction and zero",
      B: "Current that alternates between a negative direction and zero",
      C: "Current that alternates between positive and negative directions",
      D: "All these answers are correct"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5A"
  },
  {
    id: "T5A10",
    question: "Which term describes the rate at which electrical energy is used?",
    options: {
      A: "Resistance",
      B: "Current",
      C: "Power",
      D: "Voltage"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5A"
  },
  {
    id: "T5A11",
    question: "What type of current flow is opposed by resistance?",
    options: {
      A: "Direct current",
      B: "Alternating current",
      C: "RF current",
      D: "All these choices are correct"
    },
    correctAnswer: "D",
    subelement: "T5",
    group: "T5A"
  },
  {
    id: "T5A12",
    question: "What describes the number of times per second that an alternating current makes a complete cycle?",
    options: {
      A: "Pulse rate",
      B: "Speed",
      C: "Wavelength",
      D: "Frequency"
    },
    correctAnswer: "D",
    subelement: "T5",
    group: "T5A"
  },
  {
    id: "T5B01",
    question: "How many milliamperes is 1.5 amperes?",
    options: {
      A: "15 milliamperes",
      B: "150 milliamperes",
      C: "1500 milliamperes",
      D: "15,000 milliamperes"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5B02",
    question: "Which is equal to 1,500,000 hertz?",
    options: {
      A: "1500 kHz",
      B: "1500 MHz",
      C: "15 GHz",
      D: "150 kHz"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5B03",
    question: "Which is equal to one kilovolt?",
    options: {
      A: "One one-thousandth of a volt",
      B: "One hundred volts",
      C: "One thousand volts",
      D: "One million volts"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5B04",
    question: "Which is equal to one microvolt?",
    options: {
      A: "One one-millionth of a volt",
      B: "One million volts",
      C: "One thousand kilovolts",
      D: "One one-thousandth of a volt"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5B05",
    question: "Which is equal to 500 milliwatts?",
    options: {
      A: "0.02 watts",
      B: "0.5 watts",
      C: "5 watts",
      D: "50 watts"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5B06",
    question: "Which is equal to 3000 milliamperes?",
    options: {
      A: "0.003 amperes",
      B: "0.3 amperes",
      C: "3 amperes",
      D: "3,000,000 amperes"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5B07",
    question: "Which is equal to 3.525 MHz?",
    options: {
      A: "0.003525 kHz",
      B: "35.25 kHz",
      C: "3525 kHz",
      D: "3,525,000 kHz"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5B08",
    question: "Which decibel value most closely represents a power ratio of 2:1?",
    options: {
      A: "1 dB",
      B: "3 dB",
      C: "6 dB",
      D: "12 dB"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5B09",
    question: "What is the approximate amount of change, measured in decibels (dB), of a power increase from 5 watts to 10 watts?",
    options: {
      A: "2 dB",
      B: "3 dB",
      C: "5 dB",
      D: "10 dB"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5B10",
    question: "Which decibel value most closely represents a power decrease from 12 watts to 3 watts?",
    options: {
      A: "-1 dB",
      B: "-3 dB",
      C: "-6 dB",
      D: "-9 dB"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5B11",
    question: "Which decibel value represents a power increase from 20 watts to 200 watts?",
    options: {
      A: "10 dB",
      B: "12 dB",
      C: "18 dB",
      D: "28 dB"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5B12",
    question: "Which is equal to 28400 kHz?",
    options: {
      A: "28.400 kHz",
      B: "2.800 MHz",
      C: "284.00 MHz",
      D: "28.400 MHz"
    },
    correctAnswer: "D",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5B13",
    question: "Which is equal to 2425 MHz?",
    options: {
      A: "0.002425 GHz",
      B: "24.25 GHz",
      C: "2.425 GHz",
      D: "2425 GHz"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5B"
  },
  {
    id: "T5C01",
    question: "What describes the ability to store energy in an electric field?",
    options: {
      A: "Inductance",
      B: "Resistance",
      C: "Tolerance",
      D: "Capacitance"
    },
    correctAnswer: "D",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5C02",
    question: "What is the unit of capacitance?",
    options: {
      A: "The farad",
      B: "The ohm",
      C: "The volt",
      D: "The henry"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5C03",
    question: "What describes the ability to store energy in a magnetic field?",
    options: {
      A: "Admittance",
      B: "Capacitance",
      C: "Resistance",
      D: "Inductance"
    },
    correctAnswer: "D",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5C04",
    question: "What is the unit of inductance?",
    options: {
      A: "The coulomb",
      B: "The farad",
      C: "The henry",
      D: "The ohm"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5C05",
    question: "What is the unit of impedance?",
    options: {
      A: "The volt",
      B: "The ampere",
      C: "The coulomb",
      D: "The ohm"
    },
    correctAnswer: "D",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5C06",
    question: "What does the abbreviation \"RF\" mean?",
    options: {
      A: "Radio frequency signals of all types",
      B: "The resonant frequency of a tuned circuit",
      C: "The real frequency transmitted as opposed to the apparent frequency",
      D: "Reflective force in antenna transmission lines"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5C07",
    question: "What is the abbreviation for megahertz?",
    options: {
      A: "MH",
      B: "mh",
      C: "Mhz",
      D: "MHz"
    },
    correctAnswer: "D",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5C08",
    question: "What is the formula used to calculate electrical power (P) in a DC circuit?",
    options: {
      A: "P = I × E",
      B: "P = E / I",
      C: "P = E – I",
      D: "P = I + E"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5C09",
    question: "How much power is delivered by a voltage of 13.8 volts DC and a current of 10 amperes?",
    options: {
      A: "138 watts",
      B: "0.7 watts",
      C: "23.8 watts",
      D: "3.8 watts"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5C10",
    question: "How much power is delivered by a voltage of 12 volts DC and a current of 2.5 amperes?",
    options: {
      A: "4.8 watts",
      B: "30 watts",
      C: "14.5 watts",
      D: "0.208 watts"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5C11",
    question: "How much current is required to deliver 120 watts at a voltage of 12 volts DC?",
    options: {
      A: "0.1 amperes",
      B: "10 amperes",
      C: "12 amperes",
      D: "132 amperes"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5C12",
    question: "What is impedance?",
    options: {
      A: "The opposition to AC current flow",
      B: "The inverse of resistance",
      C: "The Q or Quality Factor of a component",
      D: "The power handling capability of a component"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5C13",
    question: "What is the abbreviation for kilohertz?",
    options: {
      A: "KHZ",
      B: "khz",
      C: "khZ",
      D: "kHz"
    },
    correctAnswer: "D",
    subelement: "T5",
    group: "T5C"
  },
  {
    id: "T5D01",
    question: "What formula is used to calculate current in a circuit?",
    options: {
      A: "I = E × R",
      B: "I = E / R",
      C: "I = E + R",
      D: "I = E - R"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D02",
    question: "What formula is used to calculate voltage in a circuit?",
    options: {
      A: "E = I x R",
      B: "E = I / R",
      C: "E = I + R",
      D: "E = I - R"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D03",
    question: "What formula is used to calculate resistance in a circuit?",
    options: {
      A: "R = E x I",
      B: "R = E / I",
      C: "R = E + I",
      D: "R = E - I"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D04",
    question: "What is the resistance of a circuit in which a current of 3 amperes flows when connected to 90 volts?",
    options: {
      A: "3 ohms",
      B: "30 ohms",
      C: "93 ohms",
      D: "270 ohms"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D05",
    question: "What is the resistance of a circuit for which the applied voltage is 12 volts and the current flow is 1.5 amperes?",
    options: {
      A: "18 ohms",
      B: "0.125 ohms",
      C: "8 ohms",
      D: "13.5 ohms"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D06",
    question: "What is the resistance of a circuit that draws 4 amperes from a 12-volt source?",
    options: {
      A: "3 ohms",
      B: "16 ohms",
      C: "48 ohms",
      D: "8 ohms"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D07",
    question: "What is the current in a circuit with an applied voltage of 120 volts and a resistance of 80 ohms?",
    options: {
      A: "9600 amperes",
      B: "200 amperes",
      C: "0.667 amperes",
      D: "1.5 amperes"
    },
    correctAnswer: "D",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D08",
    question: "What is the current through a 100-ohm resistor connected across 200 volts?",
    options: {
      A: "20,000 amperes",
      B: "0.5 amperes",
      C: "2 amperes",
      D: "100 amperes"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D09",
    question: "What is the current through a 24-ohm resistor connected across 240 volts?",
    options: {
      A: "24,000 amperes",
      B: "0.1 amperes",
      C: "10 amperes",
      D: "216 amperes"
    },
    correctAnswer: "C",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D10",
    question: "What is the voltage across a 2-ohm resistor if a current of 0.5 amperes flows through it?",
    options: {
      A: "1 volt",
      B: "0.25 volts",
      C: "2.5 volts",
      D: "1.5 volts"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D11",
    question: "What is the voltage across a 10-ohm resistor if a current of 1 ampere flows through it?",
    options: {
      A: "1 volt",
      B: "10 volts",
      C: "11 volts",
      D: "9 volts"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D12",
    question: "What is the voltage across a 10-ohm resistor if a current of 2 amperes flows through it?",
    options: {
      A: "8 volts",
      B: "0.2 volts",
      C: "12 volts",
      D: "20 volts"
    },
    correctAnswer: "D",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D13",
    question: "In which type of circuit is DC current the same through all components?",
    options: {
      A: "Series",
      B: "Parallel",
      C: "Resonant",
      D: "Branch"
    },
    correctAnswer: "A",
    subelement: "T5",
    group: "T5D"
  },
  {
    id: "T5D14",
    question: "In which type of circuit is voltage the same across all components?",
    options: {
      A: "Series",
      B: "Parallel",
      C: "Resonant",
      D: "Branch"
    },
    correctAnswer: "B",
    subelement: "T5",
    group: "T5D"
  },
  // Additional questions from remaining subelements (T6-T0) would continue here...
  // For brevity, adding representative questions from each remaining subelement
  
  // T6 - ELECTRONIC AND ELECTRICAL COMPONENTS
  {
    id: "T6A01",
    question: "What electrical component opposes the flow of current in a DC circuit?",
    options: {
      A: "Inductor",
      B: "Resistor",
      C: "Inverter",
      D: "Transformer"
    },
    correctAnswer: "B",
    subelement: "T6",
    group: "T6A"
  },
  {
    id: "T6A02",
    question: "What type of component is often used as an adjustable volume control?",
    options: {
      A: "Fixed resistor",
      B: "Power resistor",
      C: "Potentiometer",
      D: "Transformer"
    },
    correctAnswer: "C",
    subelement: "T6",
    group: "T6A"
  },
  {
    id: "T6A04",
    question: "What electrical component stores energy in an electric field?",
    options: {
      A: "Varistor",
      B: "Capacitor",
      C: "Inductor",
      D: "Diode"
    },
    correctAnswer: "B",
    subelement: "T6",
    group: "T6A"
  },
  {
    id: "T6A06",
    question: "What type of electrical component stores energy in a magnetic field?",
    options: {
      A: "Varistor",
      B: "Capacitor",
      C: "Inductor",
      D: "Diode"
    },
    correctAnswer: "C",
    subelement: "T6",
    group: "T6A"
  },
  {
    id: "T6A09",
    question: "What electrical component is used to protect other circuit components from current overloads?",
    options: {
      A: "Fuse",
      B: "Thyratron",
      C: "Varactor",
      D: "All these choices are correct"
    },
    correctAnswer: "A",
    subelement: "T6",
    group: "T6A"
  },
  {
    id: "T6B02",
    question: "What electronic component allows current to flow in only one direction?",
    options: {
      A: "Resistor",
      B: "Fuse",
      C: "Diode",
      D: "Driven element"
    },
    correctAnswer: "C",
    subelement: "T6",
    group: "T6B"
  },
  {
    id: "T6B03",
    question: "Which of these components can be used as an electronic switch?",
    options: {
      A: "Varistor",
      B: "Potentiometer",
      C: "Transistor",
      D: "Thermistor"
    },
    correctAnswer: "C",
    subelement: "T6",
    group: "T6B"
  },
  {
    id: "T6C01",
    question: "What is the name of an electrical wiring diagram that uses standard component symbols?",
    options: {
      A: "Bill of materials",
      B: "Connector pinout",
      C: "Schematic",
      D: "Flow chart"
    },
    correctAnswer: "C",
    subelement: "T6",
    group: "T6C"
  },
  {
    id: "T6D01",
    question: "Which of the following devices or circuits changes an alternating current into a varying direct current signal?",
    options: {
      A: "Transformer",
      B: "Rectifier",
      C: "Amplifier",
      D: "Reflector"
    },
    correctAnswer: "B",
    subelement: "T6",
    group: "T6D"
  },
  {
    id: "T6D02",
    question: "What is a relay?",
    options: {
      A: "An electrically-controlled switch",
      B: "A current controlled amplifier",
      C: "An inverting amplifier",
      D: "A pass transistor"
    },
    correctAnswer: "A",
    subelement: "T6",
    group: "T6D"
  },
  // T7 - PRACTICAL CIRCUITS
  {
    id: "T7A01",
    question: "Which term describes the ability of a receiver to detect the presence of a signal?",
    options: {
      A: "Linearity",
      B: "Sensitivity",
      C: "Selectivity",
      D: "Total Harmonic Distortion"
    },
    correctAnswer: "B",
    subelement: "T7",
    group: "T7A"
  },
  {
    id: "T7A02",
    question: "What is a transceiver?",
    options: {
      A: "A device that combines a receiver and transmitter in a single unit",
      B: "A device for mixing audio signals",
      C: "A device for signal gain",
      D: "A type of transmission line"
    },
    correctAnswer: "A",
    subelement: "T7",
    group: "T7A"
  },
  {
    id: "T7B01",
    question: "What can you do if you are told your FM handheld or mobile transceiver is over-deviating?",
    options: {
      A: "Talk louder into the microphone",
      B: "Let the transceiver cool off",
      C: "Change to a higher power level",
      D: "Talk farther away from the microphone"
    },
    correctAnswer: "D",
    subelement: "T7",
    group: "T7B"
  },
  {
    id: "T7C01",
    question: "What is the primary purpose of a dummy load?",
    options: {
      A: "To prevent overload of a transceiver's internal power supply",
      B: "To prevent radiation of signals during transmitter testing",
      C: "To improve the radiation from an antenna",
      D: "To improve the SWR of a feed line"
    },
    correctAnswer: "B",
    subelement: "T7",
    group: "T7C"
  },
  {
    id: "T7D01",
    question: "Which instrument would you use to measure electric potential?",
    options: {
      A: "An ammeter",
      B: "A voltmeter",
      C: "A wavemeter",
      D: "An ohmmeter"
    },
    correctAnswer: "B",
    subelement: "T7",
    group: "T7D"
  },
  // T8 - SIGNALS AND EMISSIONS
  {
    id: "T8A01",
    question: "Which of the following is a form of amplitude modulation?",
    options: {
      A: "Spread spectrum",
      B: "Packet radio",
      C: "Single sideband",
      D: "Phase shift keying"
    },
    correctAnswer: "C",
    subelement: "T8",
    group: "T8A"
  },
  {
    id: "T8A02",
    question: "What type of modulation is commonly used for VHF packet radio transmissions?",
    options: {
      A: "FM or PM",
      B: "SSB",
      C: "AM",
      D: "PSK"
    },
    correctAnswer: "A",
    subelement: "T8",
    group: "T8A"
  },
  {
    id: "T8B01",
    question: "What telemetry information is typically transmitted by satellite beacons?",
    options: {
      A: "The signal strength of received signals",
      B: "Time of day",
      C: "Health and status of the satellite",
      D: "All these choices are correct"
    },
    correctAnswer: "C",
    subelement: "T8",
    group: "T8B"
  },
  {
    id: "T8C01",
    question: "Which of the following methods is used to locate sources of noise interference or jamming?",
    options: {
      A: "Echolocation",
      B: "Doppler radar",
      C: "Radio direction finding",
      D: "Phase locking"
    },
    correctAnswer: "C",
    subelement: "T8",
    group: "T8C"
  },
  {
    id: "T8D01",
    question: "Which of the following is a digital communications mode?",
    options: {
      A: "Packet radio",
      B: "IEEE 802.11",
      C: "JT65",
      D: "All these choices are correct"
    },
    correctAnswer: "D",
    subelement: "T8",
    group: "T8D"
  },
  // T9 - ANTENNAS AND FEED LINES
  {
    id: "T9A01",
    question: "What is a beam antenna?",
    options: {
      A: "An antenna built from metal I-beams",
      B: "An omnidirectional antenna invented by Clarence Beam",
      C: "An antenna that concentrates signals in one direction",
      D: "An antenna that reverses the phase of a signal"
    },
    correctAnswer: "C",
    subelement: "T9",
    group: "T9A"
  },
  {
    id: "T9A02",
    question: "Which of the following describes a type of antenna loading?",
    options: {
      A: "Inserting an inductor in the radiating portion of the antenna to make it electrically longer",
      B: "Inserting a resistor in the radiating portion of the antenna to make it resonant",
      C: "Installing a spring in the base of a mobile vertical antenna to make it more flexible",
      D: "Making the antenna heavier so it will be more stable in windy conditions"
    },
    correctAnswer: "A",
    subelement: "T9",
    group: "T9A"
  },
  {
    id: "T9B01",
    question: "What is a benefit of low SWR?",
    options: {
      A: "Reduced television interference",
      B: "Reduced feed line loss",
      C: "Less interference to other stations",
      D: "All these choices are correct"
    },
    correctAnswer: "B",
    subelement: "T9",
    group: "T9B"
  },
  // T0 - SAFETY
  {
    id: "T0A01",
    question: "Which of the following is a safety hazard of a 12-volt storage battery?",
    options: {
      A: "Toxic fumes while charging",
      B: "High internal resistance",
      C: "Shorting the terminals can cause burns, fire, or an explosion",
      D: "All these choices are correct"
    },
    correctAnswer: "C",
    subelement: "T0",
    group: "T0A"
  },
  {
    id: "T0A02",
    question: "What health hazard is presented by electrical current flowing through the body?",
    options: {
      A: "It may cause injury by heating tissue",
      B: "It may disrupt the electrical functions of cells",
      C: "It may cause involuntary muscle contractions",
      D: "All these choices are correct"
    },
    correctAnswer: "D",
    subelement: "T0",
    group: "T0A"
  },
  {
    id: "T0A03",
    question: "In the United States, what circuit does black wire insulation indicate in a three-wire 120 V cable?",
    options: {
      A: "Neutral",
      B: "Hot",
      C: "Equipment ground",
      D: "Equipment ground only in older homes"
    },
    correctAnswer: "B",
    subelement: "T0",
    group: "T0A"
  },
  {
    id: "T0B01",
    question: "When should members of a tower work team wear a hard hat and safety glasses?",
    options: {
      A: "At all times except when climbing the tower",
      B: "At all times except when no work is being done on the tower",
      C: "At all times when any work is being done on the tower",
      D: "Only when the tower is being assembled"
    },
    correctAnswer: "C",
    subelement: "T0",
    group: "T0B"
  },
  {
    id: "T0C01",
    question: "What type of radiation are radio signals?",
    options: {
      A: "Gamma radiation",
      B: "Ionizing radiation",
      C: "Alpha radiation",
      D: "Non-ionizing radiation"
    },
    correctAnswer: "D",
    subelement: "T0",
    group: "T0C"
  },
  {
    id: "T0C02",
    question: "At which RF frequencies does the FCC require consideration of the maximum permissible exposure (MPE) to humans?",
    options: {
      A: "Frequencies above 1.5 MHz",
      B: "Frequencies below 1.5 MHz",
      C: "Frequencies below 300 GHz",
      D: "All RF frequencies"
    },
    correctAnswer: "D",
    subelement: "T0",
    group: "T0C"
  }
];

// Utility function to shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get random questions for practice test (35 questions)
export function getPracticeTestQuestions(count: number = 35): Question[] {
  return shuffleArray(questionPool).slice(0, count);
}

// Get a single random question for practice mode
export function getRandomQuestion(excludeIds: string[] = []): Question {
  const availableQuestions = questionPool.filter(q => !excludeIds.includes(q.id));
  if (availableQuestions.length === 0) {
    return questionPool[Math.floor(Math.random() * questionPool.length)];
  }
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
}
