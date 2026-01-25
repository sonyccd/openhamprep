-- Seed file for Supabase preview branches and local development
-- Automatically runs on preview branches and `supabase db reset`
-- Provides enough data to test all app features
--
-- TEST USER: Sign up directly in the app to create a test account.
-- This ensures the signup flow is always tested.
--
-- FULL-TEXT SEARCH: The `fts` columns on questions, glossary_terms, and topics
-- are auto-generated (STORED) columns. They will be populated automatically
-- when data is inserted - no manual seeding required for search to work.
-- =============================================================================

-- =============================================================================
-- QUESTIONS (35+ per license type for full practice tests)
-- =============================================================================

INSERT INTO public.questions (display_name, question, options, correct_answer, subelement, question_group, explanation, links, forum_url, figure_url) VALUES
  -- =========================================================================
  -- TECHNICIAN QUESTIONS (T prefix) - 40 questions
  -- =========================================================================

  -- T1 - FCC Rules
  ('T1A01', 'Which of the following is part of the Basis and Purpose of the Amateur Radio Service?',
   '["Providing personal radio communications for as many citizens as possible", "Providing communications for international non-profit organizations", "Advancing skills in the technical and communication phases of the radio art", "All of these choices are correct"]'::jsonb,
   2, 'T1', 'T1A', 'The Amateur Radio Service exists to advance skills in both the technical and communication aspects of radio. This is codified in Part 97 of the FCC rules as one of the fundamental purposes of amateur radio.',
   '[{"url": "https://www.ecfr.gov/current/title-47/chapter-I/subchapter-D/part-97", "title": "FCC Part 97 - Amateur Radio Service", "description": "Official FCC rules governing amateur radio operations", "type": "article", "siteName": "eCFR"}]'::jsonb,
   'https://forum.openhamprep.com/t/t1a01-basis-and-purpose/1', NULL),

  ('T1A02', 'Which agency regulates and enforces the rules for the Amateur Radio Service in the United States?',
   '["FEMA", "The ITU", "The FCC", "Homeland Security"]'::jsonb,
   2, 'T1', 'T1A', 'The Federal Communications Commission (FCC) is the U.S. government agency responsible for regulating all non-federal radio communications, including the Amateur Radio Service. The ITU coordinates internationally but does not enforce U.S. rules.',
   '[{"url": "https://www.fcc.gov/wireless/bureau-divisions/mobility-division/amateur-radio-service", "title": "FCC Amateur Radio Service", "description": "Official FCC page for amateur radio information", "type": "website", "siteName": "FCC"}, {"url": "https://www.arrl.org/fcc-license-info-and-டd", "title": "ARRL FCC License Information", "description": "Comprehensive guide to FCC amateur licensing", "type": "article", "siteName": "ARRL"}]'::jsonb,
   'https://forum.openhamprep.com/t/t1a02-fcc-regulation/2', NULL),

  ('T1A03', 'What do the FCC rules state regarding the use of a phonetic alphabet for station identification in the Amateur Radio Service?',
   '["It is required when identifying your station", "It is encouraged", "It is required when operating phone", "All of these choices are correct"]'::jsonb,
   1, 'T1', 'T1A', 'While using the phonetic alphabet (Alpha, Bravo, Charlie, etc.) is encouraged for clarity, especially during weak signal conditions or contests, it is not required by FCC rules for station identification.',
   '[{"url": "https://www.arrl.org/phonetics", "title": "ITU Phonetic Alphabet", "description": "Learn the standard phonetic alphabet used in amateur radio", "type": "article", "siteName": "ARRL"}]'::jsonb,
   'https://forum.openhamprep.com/t/t1a03-phonetic-alphabet/3', NULL),

  ('T1A04', 'How many operator/primary station license grants may be held by any one person?',
   '["One", "No more than two", "One for each band on which the person plans to operate", "As many as the person can pay for"]'::jsonb,
   0, 'T1', 'T1A', 'FCC rules allow only one operator/primary station license per person. However, you may hold additional licenses such as club station licenses where you serve as trustee.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T1A05', 'What is proof of possession of an FCC-granted license when your license document is not in your possession at your station?',
   '["A photocopy of the license document", "Information from the FCC ULS database", "Information on a ULS license search website", "All of these choices are correct"]'::jsonb,
   3, 'T1', 'T1A', 'Any of these methods can serve as proof of license. The FCC ULS (Universal Licensing System) database is the official record, and any printout or access to this information is acceptable proof.',
   '[{"url": "https://wireless2.fcc.gov/UlsApp/UlsSearch/searchLicense.jsp", "title": "FCC ULS License Search", "description": "Search the official FCC license database", "type": "website", "siteName": "FCC"}]'::jsonb,
   NULL,
   NULL),

  ('T1B01', 'What is the ITU?',
   '["An international association of amateur radio operators", "The International Telecommunications Union", "An amateur radio emergency service", "The International Amateur Radio Union"]'::jsonb,
   1, 'T1', 'T1B', 'The ITU (International Telecommunications Union) is a United Nations agency that coordinates global telecommunications standards and spectrum allocation. The IARU (International Amateur Radio Union) is the amateur radio organization.',
   '[{"url": "https://www.itu.int/en/about/Pages/default.aspx", "title": "About ITU", "description": "Learn about the International Telecommunication Union", "type": "website", "siteName": "ITU"}, {"url": "https://www.iaru.org/", "title": "International Amateur Radio Union", "description": "The worldwide federation of amateur radio societies", "type": "website", "siteName": "IARU"}]'::jsonb,
   NULL,
   NULL),

  ('T1B02', 'Why are the frequency assignments for some U.S. Territories different from those in the 50 U.S. States?',
   '["Some U.S. Territories are located in ITU regions other than ITU Region 2", "Frequency assignments are determined by local governments", "Frequency assignments are determined by local amateurs", "Local broadcast stations heave priority"]'::jsonb,
   0, 'T1', 'T1B', 'The world is divided into three ITU regions with different frequency allocations. The continental U.S. is in Region 2, but some territories like Guam are in Region 3, which has different allocations.',
   '[{"url": "https://www.itu.int/en/ITU-R/terrestrial/fmd/Pages/regions.aspx", "title": "ITU Radio Regions", "description": "Map and explanation of the three ITU radio regions", "type": "article", "siteName": "ITU"}]'::jsonb,
   NULL,
   NULL),

  ('T1B03', 'Which frequency is in the 6 meter amateur band?',
   '["49.00 MHz", "52.525 MHz", "28.50 MHz", "222.15 MHz"]'::jsonb,
   1, 'T1', 'T1B', 'The 6 meter band runs from 50-54 MHz. 52.525 MHz is the national FM simplex calling frequency for 6 meters. 28.50 MHz is in 10 meters, and 222.15 MHz is in 1.25 meters.',
   '[{"url": "https://www.arrl.org/band-plan", "title": "ARRL Band Plan", "description": "Complete guide to amateur radio frequency allocations", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('T1B04', 'Which amateur band includes 146.52 MHz?',
   '["6 meters", "20 meters", "70 centimeters", "2 meters"]'::jsonb,
   3, 'T1', 'T1B', 'The 2 meter band runs from 144-148 MHz. 146.52 MHz is the national FM simplex calling frequency for 2 meters, making it one of the most important frequencies to remember.',
   '[{"url": "https://www.arrl.org/files/file/Regulatory/Band%20Chart/Band%20Chart%20-%2011X17%20Color.pdf", "title": "ARRL Frequency Chart", "description": "Visual chart of all amateur radio bands", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('T1B05', 'How may amateurs use the 219 to 220 MHz segment of 1.25 meter band?',
   '["Fixed digital message forwarding systems only", "For any purpose, with no restrictions", "As a secondary service for repeaters", "As emergency communications only"]'::jsonb,
   0, 'T1', 'T1B', 'The 219-220 MHz segment is restricted to fixed digital message forwarding systems (like packet radio nodes). This is because this segment is shared with other services.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T1C01', 'For which license classes are new licenses currently available from the FCC?',
   '["Novice, Technician, General, Amateur Extra", "Technician, Technician Plus, General, Amateur Extra", "Technician, General, Amateur Extra", "Novice, Technician Plus, General, Amateur Extra"]'::jsonb,
   2, 'T1', 'T1C', 'Currently, the FCC only issues three classes of amateur licenses: Technician, General, and Amateur Extra. Novice and Technician Plus licenses are no longer issued, though existing holders may renew.',
   '[{"url": "https://www.arrl.org/getting-licensed", "title": "Getting Your Amateur Radio License", "description": "Guide to obtaining your ham radio license", "type": "article", "siteName": "ARRL"}, {"url": "https://hamstudy.org/", "title": "HamStudy.org", "description": "Free online study resources for ham radio exams", "type": "website", "siteName": "HamStudy"}]'::jsonb,
   NULL,
   NULL),

  ('T1C02', 'Who may select a desired call sign under the vanity call sign rules?',
   '["Any licensed amateur", "Only Extra Class amateurs", "Only licensed amateurs with a General or Amateur Extra Class license", "The FCC randomly selects vanity call signs"]'::jsonb,
   0, 'T1', 'T1C', 'Any licensed amateur may apply for a vanity call sign, though the call signs available depend on your license class. Technicians can get 2x3 calls, Generals can get 2x3 or 1x3, and Extras can get any format including 1x2 and 2x1.',
   '[{"url": "https://www.arrl.org/vanity-call-signs", "title": "Vanity Call Signs", "description": "How to apply for a vanity call sign", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('T1C03', 'What types of international communications are an FCC-licensed amateur radio station permitted to make?',
   '["Communications incidental to the purposes of the Amateur Radio Service and remarks of a personal character", "Communications incidental to conducting business or remarks of a personal nature", "Only communications incidental to contest exchanges; proper identification is optional", "Any communications that would be permitted by an international broadcast station"]'::jsonb,
   0, 'T1', 'T1C', 'Amateur radio communications must be incidental to the purposes of the Amateur Radio Service (technical experimentation, emergency communications, etc.) and of a personal nature. Business communications are prohibited.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T1D01', 'With which countries are FCC-licensed amateur radio stations prohibited from exchanging communications?',
   '["Any country whose primary language is not English", "Any country whose government objects to such communications", "Any country that is not a member of the International Telecommunications Union", "Any country that is not a member of the United Nations"]'::jsonb,
   1, 'T1', 'T1D', 'The FCC prohibits communications with any country whose government has notified the ITU that it objects to such communications. This list changes over time based on international relations.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T1D02', 'Under which of the following circumstances may an amateur radio station make one-way transmissions?',
   '["Under no circumstances", "When transmitting code practice, information bulletins, or transmissions necessary to provide emergency communications", "At any time, as long as no music is transmitted", "At any time, as long as the transmissions are less than 15 minutes"]'::jsonb,
   1, 'T1', 'T1D', 'While amateur radio is primarily for two-way communications, one-way transmissions are permitted for specific purposes: code practice, information bulletins, and emergency communications.',
   '[{"url": "https://www.arrl.org/w1aw", "title": "W1AW Code Practice", "description": "ARRL headquarters station code practice schedule", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  -- T2 - Operating Procedures
  ('T2A01', 'What is a common repeater frequency offset in the 2 meter band?',
   '["Plus or minus 5 MHz", "Plus or minus 600 kHz", "Plus or minus 500 kHz", "Plus or minus 1 MHz"]'::jsonb,
   1, 'T2', 'T2A', 'The standard repeater offset for 2 meters is plus or minus 600 kHz. Typically, repeaters below 147 MHz use a negative offset, and those above use a positive offset, though this varies by region.',
   '[{"url": "https://www.repeaterbook.com/", "title": "RepeaterBook", "description": "Comprehensive database of amateur radio repeaters", "type": "website", "siteName": "RepeaterBook"}]'::jsonb,
   NULL,
   NULL),

  ('T2A02', 'What is the national calling frequency for FM simplex operations in the 2 meter band?',
   '["146.520 MHz", "145.000 MHz", "432.100 MHz", "446.000 MHz"]'::jsonb,
   0, 'T2', 'T2A', '146.520 MHz is the national FM simplex calling frequency for 2 meters. This is one of the most important frequencies to program into your radio for making contacts without a repeater.',
   '[{"url": "https://www.arrl.org/band-plan", "title": "ARRL Band Plan", "description": "Official band plan showing calling frequencies", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('T2A03', 'What is a common repeater frequency offset in the 70 cm band?',
   '["Plus or minus 5 MHz", "Plus or minus 600 kHz", "Plus or minus 500 kHz", "Plus or minus 1 MHz"]'::jsonb,
   0, 'T2', 'T2A', 'The standard repeater offset for 70 cm (440 MHz band) is plus or minus 5 MHz. This is much larger than the 2 meter offset because the band is wider and frequencies are higher.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T2A04', 'What is an appropriate way to call another station on a repeater if you know the other station''s call sign?',
   '["Say break, break, then say the station''s call sign", "Say the station''s call sign, then identify with your call sign", "Say CQ three times, then the other station''s call sign", "Say CQ three times, then the other station''s call sign"]'::jsonb,
   1, 'T2', 'T2A', 'The proper procedure is to say the other station''s call sign followed by your call sign. For example: "W1ABC, this is K2XYZ." This clearly identifies both stations.',
   '[{"url": "https://www.arrl.org/files/file/Get%20on%20the%20Air/Repeater-Usage.pdf", "title": "Repeater Operating Guide", "description": "Guide to proper repeater operating procedures", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('T2A05', 'How should you respond to a station calling CQ?',
   '["Transmit CQ followed by the other station''s call sign", "Transmit your call sign followed by the other station''s call sign", "Transmit the other station''s call sign followed by your call sign", "Transmit a signal report followed by your call sign"]'::jsonb,
   2, 'T2', 'T2A', 'When responding to a CQ, say the calling station''s call sign first, then your call sign. For example: "W1ABC, this is K2XYZ." This lets them know you''re calling them specifically.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T2B01', 'What is the term used to describe an amateur station that is transmitting and receiving on the same frequency?',
   '["Full duplex", "Diplex", "Simplex", "Multiplex"]'::jsonb,
   2, 'T2', 'T2B', 'Simplex operation means transmitting and receiving on the same frequency. You cannot transmit and receive simultaneously in simplex mode - you must take turns.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T2B02', 'What is the term used to describe the use of a sub-audible tone transmitted along with normal voice audio to open the squelch of a receiver?',
   '["Carrier squelch", "Tone burst", "DTMF", "CTCSS"]'::jsonb,
   3, 'T2', 'T2B', 'CTCSS (Continuous Tone-Coded Squelch System) uses sub-audible tones (below 300 Hz) to control access to repeaters. Common brand names include PL (Private Line) by Motorola.',
   '[{"url": "https://www.sigidwiki.com/wiki/Continuous_Tone-Coded_Squelch_System_(CTCSS)", "title": "CTCSS Explained", "description": "Technical explanation of CTCSS tones", "type": "article", "siteName": "Signal Identification Wiki"}]'::jsonb,
   NULL,
   NULL),

  ('T2B03', 'Which of the following describes a linked repeater network?',
   '["A network of repeaters where signals received by one are repeated by all", "A repeater with more than one receiver", "Multiple repeaters at one location", "A repeater with a backup power source"]'::jsonb,
   0, 'T2', 'T2B', 'A linked repeater network connects multiple repeaters so that a signal received by any one repeater is retransmitted by all linked repeaters, greatly extending coverage area.',
   '[{"url": "https://www.irlp.net/", "title": "IRLP - Internet Radio Linking Project", "description": "One of the largest repeater linking systems", "type": "website", "siteName": "IRLP"}]'::jsonb,
   NULL,
   NULL),

  -- T3 - Radio Wave Propagation
  ('T3A01', 'Why do VHF signal ranges sometimes exceed their normal limits?',
   '["High pressure systems over 30 degrees north and south latitude", "A break in the E layer of the ionosphere", "Presence of a meteor trail", "All of these choices are correct"]'::jsonb,
   3, 'T3', 'T3A', 'VHF signals can travel beyond line-of-sight through various propagation mechanisms: tropospheric ducting from weather systems, sporadic E ionospheric skip, and meteor scatter from ionized meteor trails.',
   '[{"url": "https://www.dxinfocentre.com/tropo.html", "title": "Tropospheric Ducting Forecast", "description": "Real-time VHF propagation forecasts", "type": "website", "siteName": "DX Info Centre"}, {"url": "https://www.arrl.org/propagation", "title": "ARRL Propagation", "description": "Current propagation conditions and forecasts", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('T3A02', 'What is the effect of tropospheric ducting on radio communications?',
   '["It allows VHF and UHF signals to travel much farther than normal", "It causes tropospheric propagation to become very short range", "It disrupts signals on the lower HF frequencies", "It affects frequencies above 300 GHz"]'::jsonb,
   0, 'T3', 'T3A', 'Tropospheric ducting occurs when temperature inversions create a "duct" in the lower atmosphere that can guide VHF/UHF signals hundreds or even thousands of miles beyond normal range.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T3A03', 'What antenna polarization is normally used for long-distance CW and SSB contacts on the VHF and UHF bands?',
   '["Right-hand circular", "Left-hand circular", "Horizontal", "Vertical"]'::jsonb,
   2, 'T3', 'T3A', 'Horizontal polarization is standard for weak-signal VHF/UHF work (SSB, CW) because it tends to have less man-made noise and works better for ionospheric propagation. Vertical is used for FM.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T3B01', 'What is the relationship between the electric and magnetic fields of an electromagnetic wave?',
   '["They are in parallel", "They are at right angles", "They revolve around each other", "They are independent of each other"]'::jsonb,
   1, 'T3', 'T3B', 'In an electromagnetic wave, the electric and magnetic fields are perpendicular (at right angles) to each other and both are perpendicular to the direction of propagation.',
   '[{"url": "https://www.khanacademy.org/science/physics/light-waves/introduction-to-light-waves/v/electromagnetic-waves-and-the-electromagnetic-spectrum", "title": "Electromagnetic Waves - Khan Academy", "description": "Video explaining electromagnetic wave properties", "type": "video", "siteName": "Khan Academy"}]'::jsonb,
   NULL,
   NULL),

  ('T3B02', 'What property of a radio wave defines its polarization?',
   '["The orientation of the electric field", "The orientation of the magnetic field", "The ratio of the energy in the wave to its frequency", "The ratio of the velocity to wavelength"]'::jsonb,
   0, 'T3', 'T3B', 'Polarization is defined by the orientation of the electric field. A vertically polarized wave has its electric field oriented vertically, while a horizontally polarized wave has it oriented horizontally.',
   '[]'::jsonb,
   NULL,
   NULL),

  -- T4 - Amateur Radio Practices
  ('T4A01', 'Which of the following is an appropriate power supply rating for a typical 50 watt output mobile FM transceiver?',
   '["5 amperes at 12 volts", "12 amperes at 12 volts", "20 amperes at 6 volts", "5 amperes at 220 volts"]'::jsonb,
   1, 'T4', 'T4A', 'A 50-watt transceiver typically draws about 10-12 amps when transmitting. A 12-amp supply provides adequate current with some margin. Mobile radios operate on 12V DC (nominal 13.8V).',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T4A02', 'What is a function of the SSB/CW-Loss/FM switch on a VHF power amplifier?',
   '["To change the amplifier from Class A to Class C mode", "To change the amplifier output filter cutoff frequency", "To reduce gain for SSB operations", "To select the operating mode"]'::jsonb,
   3, 'T4', 'T4A', 'This switch selects the operating mode to optimize the amplifier''s performance. Different modes have different duty cycles and peak-to-average power ratios, requiring different amplifier settings.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T4B01', 'What is the effect of excessive microphone gain on SSB transmissions?',
   '["Clearer speech", "Improved signal-to-noise ratio", "Reduced transmitter output power", "Distorted and hard to understand speech"]'::jsonb,
   3, 'T4', 'T4B', 'Excessive mic gain causes audio clipping and distortion, making speech hard to understand. It also causes splatter - interference to adjacent frequencies. Proper adjustment is essential for clear SSB.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T4B02', 'Which of the following can be used to enter a transceiver frequency using a microphone?',
   '["Voice frequency recognition", "A DTMF keypad", "Carrier frequency pulses", "All of these choices are correct"]'::jsonb,
   1, 'T4', 'T4B', 'Many transceivers with DTMF microphones allow frequency entry via the DTMF keypad. DTMF (Dual-Tone Multi-Frequency) is the same tone system used by telephones.',
   '[]'::jsonb,
   NULL,
   NULL),

  -- T5 - Electrical Principles
  ('T5A01', 'Current is measured in which of the following units?',
   '["Volts", "Watts", "Ohms", "Amperes"]'::jsonb,
   3, 'T5', 'T5A', 'Current (the flow of electrons) is measured in Amperes (amps). Volts measure voltage (electrical pressure), Watts measure power, and Ohms measure resistance.',
   '[{"url": "https://www.allaboutcircuits.com/textbook/direct-current/chpt-1/electric-circuits/", "title": "Basic Electricity - All About Circuits", "description": "Comprehensive guide to basic electrical concepts", "type": "article", "siteName": "All About Circuits"}, {"url": "https://www.electronics-tutorials.ws/dccircuits/dcp_1.html", "title": "DC Circuit Theory", "description": "Understanding voltage, current, and resistance", "type": "article", "siteName": "Electronics Tutorials"}, {"url": "https://www.khanacademy.org/science/physics/circuits-topic", "title": "Circuits - Khan Academy", "description": "Video lessons on electrical circuits", "type": "video", "siteName": "Khan Academy"}]'::jsonb,
   NULL,
   NULL),

  ('T5A02', 'Electrical power is measured in which of the following units?',
   '["Volts", "Watts", "Ohms", "Amperes"]'::jsonb,
   1, 'T5', 'T5A', 'Power is measured in Watts. Power = Voltage × Current (P = E × I). A 100-watt transmitter uses 100 watts of power when transmitting.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T5A03', 'What is the name for the flow of electrons in an electric circuit?',
   '["Voltage", "Resistance", "Capacitance", "Current"]'::jsonb,
   3, 'T5', 'T5A', 'Current is the flow of electrons through a conductor. It''s measured in Amperes. Think of it like water flowing through a pipe - current is the rate of flow.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T5B01', 'How many milliamperes is 1.5 amperes?',
   '["15 milliamperes", "150 milliamperes", "1500 milliamperes", "15000 milliamperes"]'::jsonb,
   2, 'T5', 'T5B', 'Milli- means one-thousandth (1/1000). So 1.5 amperes = 1.5 × 1000 = 1500 milliamperes. Metric prefixes are essential in electronics.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T5B02', 'Which of the following units is used to measure electrical power?',
   '["Volt", "Watt", "Ohm", "Ampere"]'::jsonb,
   1, 'T5', 'T5B', 'The Watt is the unit of electrical power. It represents the rate at which electrical energy is used or produced. Named after James Watt, inventor of the steam engine.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('T5C01', 'What is the ability to store energy in an electric field called?',
   '["Inductance", "Resistance", "Tolerance", "Capacitance"]'::jsonb,
   3, 'T5', 'T5C', 'Capacitance is the ability to store energy in an electric field. Capacitors store energy between two conductive plates separated by an insulator (dielectric).',
   '[{"url": "https://www.electronics-tutorials.ws/capacitor/cap_1.html", "title": "Capacitors and Capacitance", "description": "How capacitors work and their applications", "type": "article", "siteName": "Electronics Tutorials"}]'::jsonb,
   NULL,
   NULL),

  ('T5C02', 'What is the unit of capacitance?',
   '["The farad", "The ohm", "The volt", "The henry"]'::jsonb,
   0, 'T5', 'T5C', 'Capacitance is measured in Farads. One farad is a very large unit, so you''ll typically see microfarads (µF), nanofarads (nF), or picofarads (pF). Named after Michael Faraday.',
   '[]'::jsonb,
   NULL,
   NULL),

  -- =========================================================================
  -- GENERAL QUESTIONS (G prefix) - 40 questions
  -- =========================================================================

  ('G1A01', 'On which HF bands does a General Class license holder have phone privileges?',
   '["None", "60, 20, 17, and 12 meter bands only", "160, 60, 40, 20, 17, 15, 12, and 10 meter bands", "10 and 15 meter bands only"]'::jsonb,
   2, 'G1', 'G1A', 'General Class licensees have phone privileges on 160, 60, 40, 20, 17, 15, 12, and 10 meter bands. This is a significant upgrade from Technician, which only has limited HF phone privileges on 10 meters.',
   '[{"url": "https://www.arrl.org/graphical-frequency-allocations", "title": "ARRL Frequency Allocations", "description": "Visual guide to amateur radio band allocations by license class", "type": "article", "siteName": "ARRL"}, {"url": "https://www.arrl.org/files/file/Regulatory/Band%20Chart/Band%20Chart%20-%2011X17%20Color.pdf", "title": "ARRL Band Chart PDF", "description": "Printable band chart showing all allocations", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('G1A02', 'On which of the following bands is phone operation prohibited?',
   '["160 meters", "30 meters", "17 meters", "12 meters"]'::jsonb,
   1, 'G1', 'G1A', 'The 30 meter band (10.1-10.15 MHz) is restricted to CW and data modes only - no phone (voice) operation is allowed. This is an international allocation to minimize interference.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G1A03', 'On which of the following band segments may you operate if you are a General Class licensee?',
   '["Only on the band segments authorized for Technician Class licensees", "On any band segment authorized for Amateur Extra Class licensees", "On any amateur frequency authorized for General Class or higher licenses", "Depends on the mode of transmission"]'::jsonb,
   2, 'G1', 'G1A', 'General Class licensees can operate on any frequency authorized for General Class or higher. This includes most of the HF bands, though some portions are reserved for Extra Class only.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G1A04', 'Which of the following frequencies is within the General Class portion of the 75 meter phone band segment?',
   '["3900 kHz", "3575 kHz", "3825 kHz", "3950 kHz"]'::jsonb,
   2, 'G1', 'G1A', 'The General Class portion of 75 meters for phone is 3800-4000 kHz. 3825 kHz falls within this range. 3575 kHz is in the CW/data segment, and 3900/3950 are also valid but 3825 is the answer here.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G1A05', 'Which of the following frequencies is within the General Class portion of the 20 meter phone band?',
   '["14005 kHz", "14100 kHz", "14350 kHz", "14399 kHz"]'::jsonb,
   2, 'G1', 'G1A', 'The General Class phone portion of 20 meters is 14.225-14.350 MHz. 14350 kHz (14.350 MHz) is at the upper edge of this segment. 14005 and 14100 are in the CW portion.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G1B01', 'What is the maximum height above ground to which an antenna structure may be erected without requiring notification to the FAA?',
   '["50 feet", "100 feet", "200 feet", "300 feet"]'::jsonb,
   2, 'G1', 'G1B', 'Antenna structures up to 200 feet above ground level generally do not require FAA notification, unless they are near an airport. Taller structures or those near airports require FAA review for aviation safety.',
   '[{"url": "https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_70-7460-1M.pdf", "title": "FAA Obstruction Marking and Lighting", "description": "Official FAA guidelines for antenna structures", "type": "article", "siteName": "FAA"}]'::jsonb,
   NULL,
   NULL),

  ('G1B02', 'What is one way to revalidate a club station call sign?',
   '["File a new club station application", "Add a new trustee", "Both of these choices are correct", "Neither of these choices is correct"]'::jsonb,
   2, 'G1', 'G1B', 'A club station license can be revalidated either by filing a new application or by changing the trustee. Both methods maintain the club''s call sign and license status.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G2A01', 'What mode is most commonly used for voice communications on the 160, 75, and 40 meter bands?',
   '["Upper sideband", "Lower sideband", "Vestigial sideband", "Double sideband"]'::jsonb,
   1, 'G2', 'G2A', 'Lower Sideband (LSB) is the convention for voice on frequencies below 10 MHz (160, 75/80, and 40 meters). Upper Sideband (USB) is used on frequencies above 10 MHz.',
   '[{"url": "https://www.arrl.org/ssb", "title": "Single Sideband (SSB)", "description": "Introduction to SSB operating", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('G2A02', 'What mode is most commonly used for voice communications on the 17 and 15 meter bands?',
   '["Upper sideband", "Lower sideband", "Vestigial sideband", "Double sideband"]'::jsonb,
   0, 'G2', 'G2A', 'Upper Sideband (USB) is the convention for voice on frequencies above 10 MHz, which includes 17 meters (18 MHz) and 15 meters (21 MHz). This is opposite to the lower HF bands.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G2A03', 'What do the terms "__(call sign)__ from __(location)__" and "__(call sign)__ portable __(location)__" mean?',
   '["The operator is moving between two locations", "The operator is operating remote controlled", "It is a slant indicator for mobile or portable operation", "The operator is working from a specific location away from their normal station"]'::jsonb,
   3, 'G2', 'G2A', 'These terms indicate portable operation - the operator is transmitting from a location different from their primary station address. This is common for field operations, contests, or travel.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G2B01', 'What is the purpose of a band plan?',
   '["To plan for orderly and efficient use of the band", "To set power limits for various modes", "To determine which modes may be used on specific frequencies", "All of these choices are correct"]'::jsonb,
   3, 'G2', 'G2B', 'Band plans serve multiple purposes: organizing band usage, suggesting power levels, and designating frequency segments for different modes. They promote efficient spectrum use and reduce interference.',
   '[{"url": "https://www.arrl.org/band-plan", "title": "ARRL Band Plans", "description": "Detailed band plans for all amateur bands", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('G2B02', 'What is the first thing you should do if you are in QSO when an emergency station requests help?',
   '["Ask the calling station if you may help", "Inform your QSO partner that you must stop the QSO", "Stop transmitting and stay on frequency to monitor for further calls from the station", "All of these choices are correct"]'::jsonb,
   3, 'G2', 'G2B', 'When an emergency station needs help, all of these actions are appropriate: offer assistance, inform your contact, and monitor the frequency. Emergency traffic always takes priority over routine communications.',
   '[{"url": "https://www.arrl.org/ares", "title": "ARRL ARES Program", "description": "Amateur Radio Emergency Service information", "type": "website", "siteName": "ARRL"}, {"url": "https://www.fema.gov/emergency-managers/practitioners/integrated-public-alert-warning-system", "title": "FEMA Emergency Communications", "description": "Federal emergency communication resources", "type": "website", "siteName": "FEMA"}]'::jsonb,
   NULL,
   NULL),

  ('G3A01', 'Approximately how long is the typical 11-year sunspot cycle?',
   '["8 years", "11 years", "14 years", "22 years"]'::jsonb,
   1, 'G3', 'G3A', 'The sunspot cycle averages about 11 years from minimum to minimum. Solar activity affects HF propagation - high sunspot numbers generally mean better long-distance propagation on higher HF bands.',
   '[{"url": "https://www.swpc.noaa.gov/products/solar-cycle-progression", "title": "NOAA Solar Cycle Progression", "description": "Current solar cycle data and predictions", "type": "website", "siteName": "NOAA"}, {"url": "https://www.spaceweather.com/", "title": "SpaceWeather.com", "description": "Daily space weather news and forecasts", "type": "website", "siteName": "SpaceWeather"}, {"url": "https://www.hamqsl.com/solar.html", "title": "HF Propagation and Solar Data", "description": "Real-time solar indices for ham radio", "type": "website", "siteName": "HamQSL"}]'::jsonb,
   NULL,
   NULL),

  ('G3A02', 'What effect does a solar flare have on the daytime ionospheric propagation of HF radio waves?',
   '["No significant effect", "A brief improvement in propagation", "Disruption of HF propagation due to increased ionospheric absorption", "A major increase in the maximum usable frequency"]'::jsonb,
   2, 'G3', 'G3A', 'Solar flares cause sudden ionospheric disturbances (SIDs) that increase D-layer absorption, disrupting HF propagation on the sunlit side of Earth. This can cause complete HF blackouts lasting minutes to hours.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G3A03', 'What is the solar flux index?',
   '["A measure of solar activity that correlates with HF propagation conditions", "A measure of the sun''s temperature", "A measure of ultraviolet radiation from the sun", "A measure of the solar wind"]'::jsonb,
   0, 'G3', 'G3A', 'The Solar Flux Index (SFI) measures radio emissions from the sun at 2800 MHz. Higher values (above 100-150) generally indicate better HF propagation conditions, especially on higher bands.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G3B01', 'What is skip zone?',
   '["The area covered by ground wave propagation", "An area where signals from distant stations can be heard but not from local stations", "The distance a radio wave must travel before reaching the ionosphere", "An area which is too far for ground wave propagation but too close for skip propagation"]'::jsonb,
   3, 'G3', 'G3B', 'The skip zone is the area between where ground wave coverage ends and where the sky wave returns to Earth. Stations in this zone cannot hear the transmitter - they are too far for direct reception but too close for ionospheric skip.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G3B02', 'What is an advantage of NVIS?',
   '["Low-angle radiation for working DX", "Fills in the skip zone", "Reduced signal fading", "Improved signal to noise ratio"]'::jsonb,
   1, 'G3', 'G3B', 'Near Vertical Incidence Skywave (NVIS) uses high-angle radiation to bounce signals almost straight up and back down, providing reliable coverage within a few hundred miles and filling in the skip zone.',
   '[{"url": "https://www.arrl.org/nvis", "title": "NVIS Propagation", "description": "Understanding Near Vertical Incidence Skywave", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('G4A01', 'What is one reason a power amplifier might fail to achieve full power output?',
   '["Insufficient drive power", "Low SWR", "Excessive drive power", "All of these choices are correct"]'::jsonb,
   0, 'G4', 'G4A', 'Insufficient drive power from the exciter/transceiver is a common reason for low amplifier output. The amplifier needs adequate input signal to produce its rated output. Low SWR is actually desirable.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G4A02', 'What is the purpose of an antenna tuner?',
   '["To match impedances", "To increase transmitter power", "To reduce receiver noise", "To improve antenna gain"]'::jsonb,
   0, 'G4', 'G4A', 'An antenna tuner (transmatch) matches the impedance between the transmitter output and the antenna system feedline. This allows efficient power transfer and protects the transmitter from high SWR.',
   '[{"url": "https://www.arrl.org/antenna-tuners", "title": "Antenna Tuners", "description": "How antenna tuners work and when to use them", "type": "article", "siteName": "ARRL"}, {"url": "https://www.electronics-notes.com/articles/antennas-propagation/antenna-theory/antenna-tuning-unit-atu-transmatch.php", "title": "Antenna Tuning Units", "description": "Technical explanation of ATU operation", "type": "article", "siteName": "Electronics Notes"}]'::jsonb,
   NULL,
   NULL),

  ('G4B01', 'What item of test equipment contains horizontal and vertical channel amplifiers?',
   '["An ohmmeter", "A signal generator", "An ammeter", "An oscilloscope"]'::jsonb,
   3, 'G4', 'G4B', 'An oscilloscope has horizontal and vertical channel amplifiers to display waveforms on its screen. The vertical amplifier controls signal amplitude display, while the horizontal controls the time base.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G4B02', 'Which of the following is a use for an antenna analyzer?',
   '["Measuring the SWR of an antenna system", "Determining if an amplifier is operating properly", "Measuring the gain of a directional antenna", "Determining the front-to-back ratio of an antenna"]'::jsonb,
   0, 'G4', 'G4B', 'An antenna analyzer measures SWR, impedance, and resonant frequency of an antenna system. It''s an essential tool for antenna installation and troubleshooting without needing to transmit.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G5A01', 'What happens when the weights of reactance and resistance in a series circuit are equal?',
   '["The circuit has maximum resistance", "The circuit has minimum resistance", "The circuit is resonant", "The circuit has maximum impedance"]'::jsonb,
   2, 'G5', 'G5A', 'When inductive and capacitive reactances are equal, they cancel out, leaving only resistance. This is the resonant condition where impedance is at its minimum (equals resistance) and current is maximum.',
   '[{"url": "https://www.electronics-tutorials.ws/accircuits/series-resonance.html", "title": "Series Resonance", "description": "Understanding resonance in series RLC circuits", "type": "article", "siteName": "Electronics Tutorials"}]'::jsonb,
   NULL,
   NULL),

  ('G5A02', 'What is the unit of admittance?',
   '["Ohms", "Watts", "Siemens", "Farads"]'::jsonb,
   2, 'G5', 'G5A', 'Admittance (the reciprocal of impedance) is measured in Siemens (S). It describes how easily current flows through a circuit. Formerly called "mhos" (ohms spelled backwards).',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G5B01', 'What is the equation for calculating power in a DC circuit?',
   '["P = E / R", "P = E x I", "P = I / E", "P = R x I"]'::jsonb,
   1, 'G5', 'G5B', 'Power equals voltage times current: P = E × I (or P = V × I). This fundamental equation is used constantly in electronics. Other forms include P = I²R and P = E²/R.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G5B02', 'How does a resistor''s value change with temperature?',
   '["Decreases as temperature increases", "Increases as temperature increases", "Stays the same regardless of temperature", "Varies in unpredictable ways"]'::jsonb,
   1, 'G5', 'G5B', 'Most resistors have a positive temperature coefficient - their resistance increases as temperature rises. This is because increased atomic vibration impedes electron flow through the material.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G6A01', 'What is the effect of a capacitor on a DC circuit?',
   '["Allows DC to pass through", "Blocks DC", "Increases DC voltage", "Reduces DC current"]'::jsonb,
   1, 'G6', 'G6A', 'A capacitor blocks DC while allowing AC to pass. Once charged, no current flows through a capacitor in a DC circuit. This property is used for coupling AC signals while blocking DC bias.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G6A02', 'What is the effect of an inductor on an AC circuit?',
   '["Allows all frequencies to pass equally", "Passes low frequencies better than high frequencies", "Passes high frequencies better than low frequencies", "Blocks all frequencies equally"]'::jsonb,
   1, 'G6', 'G6A', 'An inductor''s reactance increases with frequency (XL = 2πfL), so it passes low frequencies more easily than high frequencies. This is the opposite of a capacitor''s behavior.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G7A01', 'What is the function of a power supply filter capacitor?',
   '["To increase voltage output", "To reduce ripple voltage", "To increase current output", "To reduce voltage output"]'::jsonb,
   1, 'G7', 'G7A', 'Filter capacitors smooth the pulsating DC from a rectifier by storing energy during voltage peaks and releasing it during valleys, reducing ripple voltage and producing cleaner DC output.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G7A02', 'What happens to the DC voltage output of a power supply when the load current increases?',
   '["It increases", "It decreases", "It stays the same", "It oscillates"]'::jsonb,
   1, 'G7', 'G7A', 'As load current increases, voltage typically decreases due to internal resistance, transformer losses, and filter capacitor discharge. This is why power supplies are rated for specific current limits.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G8A01', 'What is the advantage of SSB over FM for voice transmissions?',
   '["Better audio quality", "Less bandwidth used", "Higher audio frequencies transmitted", "Lower signal strength required"]'::jsonb,
   1, 'G8', 'G8A', 'SSB uses approximately 3 kHz of bandwidth compared to 10-15 kHz for FM. This spectrum efficiency allows more stations to operate and enables long-distance communication with less power.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G8A02', 'What is the approximate bandwidth of a typical SSB voice signal?',
   '["1 kHz", "3 kHz", "6 kHz", "15 kHz"]'::jsonb,
   1, 'G8', 'G8A', 'A typical SSB voice signal occupies about 3 kHz of bandwidth, carrying audio frequencies from roughly 300-3000 Hz. This is half the bandwidth of AM since only one sideband is transmitted.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G9A01', 'What is the characteristic impedance of coaxial cable?',
   '["The DC resistance of the cable", "The AC resistance that would transfer maximum power from source to load", "The variable resistance that changes with temperature", "The resistance measured when the cable is coiled"]'::jsonb,
   1, 'G9', 'G9A', 'Characteristic impedance is the AC impedance that provides maximum power transfer. Common values are 50 ohms (amateur radio) and 75 ohms (TV/cable). It depends on conductor geometry, not length.',
   '[{"url": "https://www.electronics-notes.com/articles/antennas-propagation/feeder-transmission-lines/coax-cable-specifications-types.php", "title": "Coaxial Cable Types & Specifications", "description": "Guide to different coax cables and their uses", "type": "article", "siteName": "Electronics Notes"}]'::jsonb,
   NULL,
   NULL),

  ('G9A02', 'What is a disadvantage of using too long a transmission line?',
   '["Increased power loss", "Decreased standing wave ratio", "Increased antenna gain", "Decreased bandwidth"]'::jsonb,
   0, 'G9', 'G9A', 'Longer transmission lines have more power loss due to conductor resistance and dielectric losses. These losses increase with frequency. Always use the shortest practical feedline length.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('G0A01', 'What is one way to mitigate the risk of RF exposure to people?',
   '["Increase transmitter power", "Lower antenna height", "Increase distance from the antenna", "Use FM instead of SSB"]'::jsonb,
   2, 'G0', 'G0A', 'Increasing distance from the antenna reduces RF exposure because field strength decreases rapidly with distance (inverse square law). Other methods include using directional antennas and reducing power.',
   '[{"url": "https://www.arrl.org/rf-exposure", "title": "ARRL RF Exposure Resources", "description": "Understanding and calculating RF exposure", "type": "article", "siteName": "ARRL"}, {"url": "https://www.fcc.gov/consumers/guides/human-exposure-radio-frequency-fields-guidelines-cellular-and-pcs-sites", "title": "FCC RF Exposure Guidelines", "description": "Official FCC guidance on RF safety", "type": "article", "siteName": "FCC"}]'::jsonb,
   NULL,
   NULL),

  ('G0A02', 'When evaluating RF exposure levels from your station, what should be considered?',
   '["Duty cycle of the transmitter", "Frequency and power level", "Distance from antenna", "All of these choices are correct"]'::jsonb,
   3, 'G0', 'G0A', 'RF exposure evaluation must consider all factors: duty cycle (how often you transmit), frequency and power level (determines field strength), and distance from antenna (determines exposure level).',
   '[]'::jsonb,
   NULL,
   NULL),

  -- =========================================================================
  -- EXTRA QUESTIONS (E prefix) - 50 questions for full practice exams
  -- =========================================================================

  ('E1A01', 'When using a transceiver that displays the carrier frequency of phone signals, which of the following displayed frequencies represents the highest frequency at which a properly adjusted USB emission will be totally within the band?',
   '["The exact upper band edge", "300 Hz below the upper band edge", "1 kHz below the upper band edge", "3 kHz below the upper band edge"]'::jsonb,
   3, 'E1', 'E1A', 'USB signals extend about 3 kHz above the displayed carrier frequency. To keep the entire signal within the band, the carrier must be at least 3 kHz below the upper band edge.',
   '[{"url": "https://www.arrl.org/ssb-operating", "title": "SSB Operating - ARRL", "description": "Understanding single sideband operation and bandwidth", "type": "article", "siteName": "ARRL"}, {"url": "https://www.electronics-notes.com/articles/radio/modulation/single-sideband-ssb-modulation.php", "title": "Single Sideband SSB Modulation", "description": "Technical explanation of SSB and bandwidth requirements", "type": "article", "siteName": "Electronics Notes"}]'::jsonb,
   NULL,
   NULL),

  ('E1A02', 'When using a transceiver that displays the carrier frequency of phone signals, which of the following displayed frequencies represents the lowest frequency at which a properly adjusted LSB emission will be totally within the band?',
   '["The exact lower band edge", "300 Hz above the lower band edge", "1 kHz above the lower band edge", "3 kHz above the lower band edge"]'::jsonb,
   3, 'E1', 'E1A', 'LSB signals extend about 3 kHz below the displayed carrier frequency. To keep the entire signal within the band, the carrier must be at least 3 kHz above the lower band edge.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E1A03', 'What is the maximum legal carrier frequency on 60 meters for USB RTTY emissions?',
   '["5330.5 kHz", "5346.5 kHz", "5366.5 kHz", "5371.5 kHz"]'::jsonb,
   2, 'E1', 'E1A', 'The 60 meter band has specific channel allocations. For USB RTTY, the maximum carrier frequency is 5366.5 kHz to keep emissions within the authorized channel bandwidth.',
   '[{"url": "https://www.arrl.org/60-meter-faq", "title": "60 Meter Band FAQ - ARRL", "description": "Comprehensive guide to the 60 meter amateur band", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('E1A04', 'With your transceiver displaying carrier frequency, what is the maximum legal frequency on 60 meters for USB phone emissions?',
   '["5330.5 kHz", "5346.5 kHz", "5366.5 kHz", "5371.5 kHz"]'::jsonb,
   2, 'E1', 'E1A', 'On 60 meters, USB phone emissions must stay within channel limits. With a displayed carrier of 5366.5 kHz, the voice signal stays within the authorized 2.8 kHz bandwidth.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E1A05', 'What is the maximum power output permitted on the 60 meter band?',
   '["100 watts PEP", "200 watts PEP", "50 watts PEP", "10 watts PEP"]'::jsonb,
   0, 'E1', 'E1A', 'The 60 meter band is limited to 100 watts PEP effective radiated power (ERP). This is lower than most HF bands because 60 meters is shared with government services.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E1B01', 'What is the maximum permitted transmitter peak envelope power for an amateur station operating in the satellite sub-bands?',
   '["250 watts", "500 watts", "1000 watts", "1500 watts"]'::jsonb,
   0, 'E1', 'E1B', 'Satellite sub-bands are limited to 250 watts PEP to prevent interference with spacecraft receivers. Higher power could damage sensitive satellite equipment or cause interference.',
   '[{"url": "https://www.amsat.org/two-way-satellites/", "title": "Two-Way Amateur Satellites - AMSAT", "description": "Guide to amateur satellite operations and power limits", "type": "article", "siteName": "AMSAT"}, {"url": "https://www.arrl.org/amateur-satellite-frequencies", "title": "Amateur Satellite Frequencies - ARRL", "description": "Official satellite sub-band allocations and rules", "type": "article", "siteName": "ARRL"}, {"url": "https://www.youtube.com/watch?v=dU1ka-4SXDM", "title": "Getting Started with Amateur Satellites", "description": "Video introduction to satellite operations", "type": "video", "siteName": "YouTube"}]'::jsonb,
   NULL,
   NULL),

  ('E1B02', 'What is the amateur satellite service?',
   '["A service using amateur stations on Earth satellites for specific purposes", "A service using stations on Earth satellites for communication with other countries", "A service using stations on Earth satellites for commercial purposes", "A service using amateur stations to provide information to satellites"]'::jsonb,
   0, 'E1', 'E1B', 'The amateur satellite service uses amateur radio stations on satellites (like AMSAT''s OSCAR series) for amateur radio purposes including communication, experimentation, and education.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E2A01', 'How are radio communications between amateur stations and international space stations governed?',
   '["By United Nations treaty", "By agreements between the countries involved", "By rules of the International Telecommunication Union", "By rules of the International Amateur Radio Union"]'::jsonb,
   1, 'E2', 'E2A', 'Amateur radio contacts with the ISS are governed by agreements between the participating countries (NASA, ESA, etc.). The ARISS program coordinates these educational contacts.',
   '[{"url": "https://www.ariss.org/", "title": "ARISS - Amateur Radio on the ISS", "description": "Official ARISS program for ISS amateur radio contacts", "type": "website", "siteName": "ARISS"}, {"url": "https://www.nasa.gov/mission/amateur-radio/", "title": "NASA Amateur Radio Program", "description": "NASA''s involvement in ISS amateur radio operations", "type": "article", "siteName": "NASA"}]'::jsonb,
   NULL,
   NULL),

  ('E2A02', 'What minimum information must be transmitted on a spread spectrum transmission?',
   '["The station call sign", "The ITU Region where the station is located", "The frequency of the transmission", "The date and time of transmission"]'::jsonb,
   0, 'E2', 'E2A', 'All amateur transmissions must include the station call sign for identification. This applies to spread spectrum just as it does to any other mode of transmission.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E2A03', 'What is the meaning of the term "critical frequency" in reference to propagation?',
   '["The frequency below which a radio wave will not be refracted by the ionosphere", "The highest frequency that will be refracted back to Earth", "The frequency that will refract through the ionosphere with maximum efficiency", "The lowest frequency that will refract back to Earth"]'::jsonb,
   1, 'E2', 'E2A', 'The critical frequency is the highest frequency that will be reflected straight back to Earth when transmitted vertically. Higher frequencies pass through the ionosphere into space.',
   '[{"url": "https://www.qsl.net/w2vtm/propagation.html", "title": "HF Radio Propagation", "description": "Understanding ionospheric propagation and critical frequency", "type": "article", "siteName": "QSL.net"}]'::jsonb,
   NULL,
   NULL),

  ('E3A01', 'What is the approximate lower frequency limit for EME communications?',
   '["14 MHz", "50 MHz", "144 MHz", "432 MHz"]'::jsonb,
   1, 'E3', 'E3A', 'Earth-Moon-Earth (EME/moonbounce) communications generally start around 50 MHz (6 meters). Lower frequencies have too much cosmic noise, and the antenna sizes become impractical.',
   '[{"url": "https://www.qsl.net/w1ghz/eme.htm", "title": "EME (Moonbounce) Communications", "description": "Introduction to Earth-Moon-Earth communications", "type": "article", "siteName": "QSL.net"}, {"url": "https://www.youtube.com/watch?v=4TfD6JnFgK4", "title": "Moonbounce EME Explained", "description": "Video explaining how EME communications work", "type": "video", "siteName": "YouTube"}]'::jsonb,
   NULL,
   NULL),

  ('E3A02', 'What characterizes EME communications?',
   '["Very high path loss and low data rates", "Long delays and signal distortion", "Both of these choices are correct", "Neither of these choices is correct"]'::jsonb,
   2, 'E3', 'E3A', 'EME signals travel approximately 500,000 miles round trip, causing about 2.5 second delays. The extreme path loss (250+ dB) requires high power and large antennas, limiting data rates.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E3A03', 'What is the typical path loss of a 2 meter EME signal?',
   '["100 dB", "150 dB", "252 dB", "350 dB"]'::jsonb,
   2, 'E3', 'E3A', 'The path loss for 2 meter EME is approximately 252 dB due to the ~500,000 mile round trip distance. This extreme loss requires high power, large antennas, and sensitive receivers.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E4A01', 'Which of the following test instruments would be best for measuring the SWR of a beam antenna?',
   '["A spectrum analyzer", "A digital voltmeter", "A directional wattmeter", "An ohmmeter"]'::jsonb,
   2, 'E4', 'E4A', 'A directional wattmeter measures both forward and reflected power, allowing SWR calculation. It''s the standard instrument for measuring antenna system performance under actual operating conditions.',
   '[{"url": "https://www.arrl.org/swr", "title": "Understanding SWR - ARRL", "description": "Guide to understanding and measuring SWR", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('E4A02', 'Which of the following would be the best instrument for measuring a filter''s frequency response?',
   '["An oscilloscope", "A vector network analyzer", "A function generator", "A logic analyzer"]'::jsonb,
   1, 'E4', 'E4A', 'A vector network analyzer (VNA) measures both magnitude and phase across frequency, providing complete characterization of a filter''s frequency response, including insertion loss and return loss.',
   '[{"url": "https://www.tek.com/en/documents/primer/what-vector-network-analyzer", "title": "What is a Vector Network Analyzer?", "description": "Introduction to VNA technology and applications", "type": "article", "siteName": "Tektronix"}, {"url": "https://www.youtube.com/watch?v=_pjcEKQY_Cs", "title": "NanoVNA Introduction for Ham Radio", "description": "Video tutorial on using a VNA for amateur radio", "type": "video", "siteName": "YouTube"}, {"url": "https://www.allaboutcircuits.com/technical-articles/an-introduction-to-network-analysis/", "title": "Introduction to Network Analysis", "description": "Technical overview of RF network analysis", "type": "article", "siteName": "All About Circuits"}]'::jsonb,
   NULL,
   NULL),

  ('E4A03', 'What noise source is generally most significant when analyzing receiver performance?',
   '["Thermal noise", "Shot noise", "Flicker noise", "All of these equally"]'::jsonb,
   0, 'E4', 'E4A', 'Thermal noise (Johnson-Nyquist noise) is the dominant noise source in most receivers. It''s generated by random electron motion in resistive components and sets the fundamental noise floor.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E5A01', 'What is the phase relationship between reactance and resistance in a series circuit?',
   '["They are in phase", "They are 90 degrees out of phase", "They are 180 degrees out of phase", "They are 45 degrees out of phase"]'::jsonb,
   1, 'E5', 'E5A', 'Reactance and resistance are 90 degrees out of phase. In impedance calculations, they are represented as perpendicular vectors (resistance on real axis, reactance on imaginary axis).',
   '[{"url": "https://www.electronics-tutorials.ws/accircuits/ac-inductance.html", "title": "AC Inductance and Impedance", "description": "Understanding phase relationships in AC circuits", "type": "article", "siteName": "Electronics Tutorials"}, {"url": "https://www.khanacademy.org/science/physics/circuits-topic/ac-circuit-analysis/v/impedance", "title": "Impedance - Khan Academy", "description": "Video lesson on impedance and phase relationships", "type": "video", "siteName": "Khan Academy"}]'::jsonb,
   NULL,
   NULL),

  ('E5A02', 'What is resonance in an electrical circuit?',
   '["The condition where inductive and capacitive reactances are equal", "The condition where resistance equals reactance", "The condition where impedance is maximum", "The condition where current is minimum"]'::jsonb,
   0, 'E5', 'E5A', 'Resonance occurs when inductive reactance (XL) equals capacitive reactance (XC). At this point, they cancel, leaving only resistance. The circuit readily accepts energy at this frequency.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E5A03', 'What is the Q of a parallel RLC circuit?',
   '["Resistance divided by reactance", "Reactance divided by resistance", "The ratio of capacitive to inductive reactance", "The square root of resistance times reactance"]'::jsonb,
   1, 'E5', 'E5A', 'In a parallel RLC circuit, Q = R/X (resistance divided by reactance). Higher Q means narrower bandwidth and sharper tuning. This is opposite to series circuits where Q = X/R.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E5B01', 'What is the result of skin effect?',
   '["RF current flows near the surface of a conductor", "DC current flows near the center of a conductor", "AC voltage appears across an open circuit", "RF voltage appears across a short circuit"]'::jsonb,
   0, 'E5', 'E5B', 'Skin effect causes RF current to flow primarily near the surface of a conductor. The higher the frequency, the thinner the effective conducting layer, increasing effective resistance.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E5B02', 'What causes the skin effect?',
   '["The magnetic field surrounding the conductor", "The electric field surrounding the conductor", "Eddy currents in the conductor", "All of these choices are correct"]'::jsonb,
   3, 'E5', 'E5B', 'Skin effect results from the interaction of magnetic fields, electric fields, and eddy currents. The changing magnetic field induces eddy currents that oppose current flow in the conductor center.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E6A01', 'What is the function of a three-terminal regulator IC?',
   '["To increase voltage", "To provide constant voltage", "To convert AC to DC", "To amplify signals"]'::jsonb,
   1, 'E6', 'E6A', 'Three-terminal regulators (like 7805, 7812) provide a constant, regulated DC output voltage regardless of input voltage variations or load changes. They have input, output, and ground terminals.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E6A02', 'What is the maximum operating frequency of a typical 741 op-amp?',
   '["1 MHz", "10 MHz", "100 MHz", "1 GHz"]'::jsonb,
   0, 'E6', 'E6A', 'The classic 741 op-amp has a unity-gain bandwidth of about 1 MHz. Modern op-amps can operate at much higher frequencies, but the 741 is limited by its internal compensation.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E6A03', 'What is the primary advantage of a MOSFET over a bipolar transistor?',
   '["Higher gain", "Higher input impedance", "Higher power handling", "Lower noise"]'::jsonb,
   1, 'E6', 'E6A', 'MOSFETs have extremely high input impedance (megohms to gigohms) because the gate is insulated from the channel. This means they draw virtually no input current, simplifying circuit design.',
   '[{"url": "https://www.electronics-tutorials.ws/transistor/tran_6.html", "title": "MOSFET Transistor", "description": "Understanding MOSFET operation and advantages", "type": "article", "siteName": "Electronics Tutorials"}]'::jsonb,
   NULL,
   NULL),

  ('E7A01', 'What is an advantage of a Class D amplifier?',
   '["Higher fidelity", "Higher efficiency", "Lower noise", "Wider bandwidth"]'::jsonb,
   1, 'E7', 'E7A', 'Class D amplifiers use switching (PWM) rather than linear operation, achieving efficiencies of 90% or higher. They generate less heat and are widely used in audio and RF applications.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E7A02', 'What type of bias is used in a Class AB amplifier?',
   '["Forward bias only", "Reverse bias only", "Slight forward bias", "No bias"]'::jsonb,
   2, 'E7', 'E7A', 'Class AB amplifiers use slight forward bias so both output devices conduct for slightly more than half the input cycle. This reduces crossover distortion while maintaining reasonable efficiency.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E7A03', 'What is the purpose of neutralization in a vacuum tube amplifier?',
   '["To increase gain", "To cancel feedback and prevent oscillation", "To improve frequency response", "To reduce noise"]'::jsonb,
   1, 'E7', 'E7A', 'Neutralization cancels the internal feedback through tube interelectrode capacitance that can cause oscillation. A small out-of-phase signal is fed back to cancel the unwanted feedback.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E8A01', 'What is the term for the number of times an ac signal reaches maximum value in one second?',
   '["Bandwidth", "Cycle rate", "Frequency", "Pulse rate"]'::jsonb,
   2, 'E8', 'E8A', 'Frequency is the number of complete cycles per second, measured in Hertz (Hz). One cycle includes both positive and negative maximum values, so frequency equals the rate of reaching maximum.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E8A02', 'What is the bandwidth of a properly adjusted 170 Hz shift FSK RTTY signal?',
   '["170 Hz", "250 Hz", "500 Hz", "1 kHz"]'::jsonb,
   1, 'E8', 'E8A', 'For FSK signals, bandwidth is approximately shift plus baud rate. For 170 Hz shift RTTY at 45.45 baud, bandwidth is roughly 170 + 45 ≈ 250 Hz using Carson''s rule approximation.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E8A03', 'What is the typical bandwidth of a PSK31 signal?',
   '["31 Hz", "62.5 Hz", "150 Hz", "300 Hz"]'::jsonb,
   0, 'E8', 'E8A', 'PSK31 has an extremely narrow bandwidth of approximately 31 Hz. This efficient mode allows many signals to fit in the same spectrum space as one SSB signal, ideal for crowded bands.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E9A01', 'What is antenna bandwidth?',
   '["Antenna length divided by number of elements", "The frequency range over which an antenna satisfies a performance requirement", "The angle between the half-power points on an antenna pattern", "The frequency spread between two antennas of different designs"]'::jsonb,
   1, 'E9', 'E9A', 'Antenna bandwidth is the frequency range over which the antenna maintains acceptable performance, typically defined by SWR limits (e.g., 2:1 SWR bandwidth) or gain specifications.',
   '[{"url": "https://www.antenna-theory.com/basics/bandwidth.php", "title": "Antenna Bandwidth", "description": "Understanding antenna bandwidth and its measurement", "type": "article", "siteName": "Antenna Theory"}, {"url": "https://www.arrl.org/antenna-basics", "title": "Antenna Basics - ARRL", "description": "Introduction to antenna fundamentals including bandwidth", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('E9A02', 'What is the approximate radiation resistance of a quarter-wave vertical antenna?',
   '["12 ohms", "36 ohms", "72 ohms", "144 ohms"]'::jsonb,
   1, 'E9', 'E9A', 'A quarter-wave vertical over a perfect ground has a radiation resistance of approximately 36 ohms. This is half the 73-ohm resistance of a half-wave dipole due to the ground plane image.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E9A03', 'What is the advantage of using a trap antenna?',
   '["It can operate on multiple bands", "It has higher gain", "It is more directional", "It has wider bandwidth"]'::jsonb,
   0, 'E9', 'E9A', 'Trap antennas use LC circuits to electrically shorten the antenna on higher bands, allowing operation on multiple bands with a single antenna. Trade-offs include some loss and narrower bandwidth.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E0A01', 'What is the most likely cause of RF burns?',
   '["High SWR", "Excessive RF current through a conductor in contact with the skin", "RF feedback", "High power output"]'::jsonb,
   1, 'E0', 'E0A', 'RF burns occur when high-frequency current flows through skin, causing localized heating. This typically happens when touching an antenna or feedline carrying RF power during transmission.',
   '[{"url": "https://www.arrl.org/rf-exposure", "title": "RF Exposure and Safety - ARRL", "description": "Guide to RF safety and preventing RF burns", "type": "article", "siteName": "ARRL"}, {"url": "https://www.fcc.gov/engineering-technology/electromagnetic-compatibility-division/radio-frequency-safety/faq/rf-safety", "title": "FCC RF Safety FAQ", "description": "Official FCC guidance on RF exposure safety", "type": "article", "siteName": "FCC"}, {"url": "https://www.youtube.com/watch?v=2gf7vYDH9R8", "title": "RF Safety for Ham Radio Operators", "description": "Video overview of RF safety practices", "type": "video", "siteName": "YouTube"}, {"url": "https://www.osha.gov/radiofrequency-and-microwave-radiation", "title": "OSHA RF Radiation Standards", "description": "Workplace RF safety standards", "type": "article", "siteName": "OSHA"}]'::jsonb,
   NULL,
   NULL),

  ('E0A02', 'What is the purpose of the safety interlocks installed in high voltage power supplies?',
   '["To reduce interference to other equipment", "To prevent dangerous shock hazards", "To improve power supply regulation", "To increase efficiency"]'::jsonb,
   1, 'E0', 'E0A', 'Safety interlocks disconnect high voltage when equipment covers are removed, preventing accidental contact with lethal voltages. They are essential safety features in tube amplifiers and HV supplies.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E0A03', 'What is the minimum safe distance from a power line to an antenna?',
   '["Equal to the height of the power line", "Enough that the antenna cannot contact the power line if it falls", "Half the height of the power line", "There is no minimum distance if the antenna is properly insulated"]'::jsonb,
   1, 'E0', 'E0A', 'Antennas must be positioned so they cannot contact power lines even if the antenna or support structure falls. Power line contact is one of the leading causes of amateur radio fatalities.',
   '[]'::jsonb,
   NULL,
   NULL),

  -- Additional Extra questions to reach 50 total for practice exams
  ('E1B03', 'What is the permitted mean power of any spurious emission relative to the mean power of the fundamental emission from a station transmitter?',
   '["At least 30 dB below", "At least 40 dB below", "At least 43 dB below", "At least 50 dB below"]'::jsonb,
   2, 'E1', 'E1B', 'FCC regulations require spurious emissions to be at least 43 dB below the mean power of the fundamental emission for most amateur stations.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E1B04', 'What is the amateur service definition of telemetry?',
   '["One-way transmission of measurements at a distance", "Two-way transmission of measurements", "One-way transmission to initiate or modify functions", "Any digital transmission"]'::jsonb,
   0, 'E1', 'E1B', 'Telemetry is defined as one-way transmission of measurements at a distance from the measuring instrument, commonly used in satellite and balloon operations.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E2A05', 'What is the direction of an ascending pass for an amateur satellite?',
   '["From west to east", "From east to west", "From south to north", "From north to south"]'::jsonb,
   2, 'E2', 'E2A', 'An ascending pass occurs when a satellite is moving from south to north relative to the observer. The satellite rises in the south and sets in the north.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E2A06', 'What is the most common technique for estimating signal strength during satellite communications?',
   '["Automatic link establishment", "Use of RST signal reports", "Comparison with a reference signal", "S-meter readings"]'::jsonb,
   1, 'E2', 'E2A', 'RST signal reports (Readability, Strength, Tone) are the standard method for reporting signal quality during satellite and other amateur communications.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E3A05', 'What is the approximate maximum distance along the Earth''s surface covered by one hop using the F2 region?',
   '["180 miles", "1,200 miles", "2,500 miles", "12,000 miles"]'::jsonb,
   2, 'E3', 'E3A', 'The F2 region allows single-hop distances of approximately 2,500 miles. Multiple hops can extend this range around the world.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E3A06', 'What is the approximate maximum range for signals using transequatorial propagation?',
   '["1,000 miles", "2,500 miles", "5,000 miles", "7,500 miles"]'::jsonb,
   2, 'E3', 'E3A', 'Transequatorial propagation (TE) can provide communication over distances of approximately 5,000 miles between stations at similar distances north and south of the equator.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E4A05', 'What is the purpose of a preamp in a receiver?',
   '["To increase selectivity", "To improve weak signal reception", "To reduce power consumption", "To filter out harmonics"]'::jsonb,
   1, 'E4', 'E4A', 'A preamplifier boosts weak signals before they reach the main receiver, improving the ability to hear weak stations while maintaining good signal-to-noise ratio.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E4A06', 'What is the primary purpose of an automatic notch filter?',
   '["To reduce impulse noise", "To remove interfering carriers", "To improve SSB reception", "To reduce receiver bandwidth"]'::jsonb,
   1, 'E4', 'E4A', 'An automatic notch filter detects and removes interfering carriers (heterodynes) that appear as annoying tones in the received audio.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E5A05', 'What is the result of skin effect?',
   '["RF current flows in a thin layer of the conductor close to the surface", "RF resistance increases as frequency decreases", "Conductor resistance decreases", "Conductor heating decreases"]'::jsonb,
   0, 'E5', 'E5A', 'Skin effect causes RF current to flow primarily near the surface of a conductor. This increases effective resistance at higher frequencies.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E5A06', 'What is the unit of electrical charge?',
   '["Volt", "Coulomb", "Watt", "Farad"]'::jsonb,
   1, 'E5', 'E5A', 'The coulomb is the SI unit of electrical charge. One coulomb equals approximately 6.24 x 10^18 electrons.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E6A05', 'What is the primary function of a mixer in a superheterodyne receiver?',
   '["To filter out unwanted signals", "To combine two signals to produce sum and difference frequencies", "To amplify weak signals", "To demodulate the signal"]'::jsonb,
   1, 'E6', 'E6A', 'A mixer combines the incoming RF signal with the local oscillator signal to produce intermediate frequencies (IF) that are easier to process.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E6A06', 'What is a characteristic of a Class A amplifier?',
   '["It operates with collector current cutoff during part of the cycle", "It has the highest efficiency", "It operates with collector current flowing during the entire cycle", "It requires a tuned output circuit"]'::jsonb,
   2, 'E6', 'E6A', 'Class A amplifiers conduct during the entire input cycle, providing the best linearity but lowest efficiency (typically 25-50%).',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E7A04', 'What type of filter is used to pass signals above a certain frequency and reject signals below?',
   '["Low-pass filter", "High-pass filter", "Band-pass filter", "Notch filter"]'::jsonb,
   1, 'E7', 'E7A', 'A high-pass filter allows frequencies above its cutoff frequency to pass while attenuating lower frequencies. Used to block low-frequency interference.',
   '[]'::jsonb,
   NULL,
   NULL),

  ('E8A04', 'What is the approximate bandwidth of a properly modulated Single Sideband phone signal?',
   '["1 kHz", "3 kHz", "6 kHz", "15 kHz"]'::jsonb,
   1, 'E8', 'E8A', 'A properly adjusted SSB phone signal occupies approximately 3 kHz of bandwidth, making it twice as spectrum-efficient as AM.',
   '[]'::jsonb,
   NULL,
   NULL),

  -- Questions with figure references for testing figure display
  -- Note: These questions reference figures but have NULL figure_url since no images are uploaded in seed data.
  -- This tests the "Figure not available" placeholder functionality.
  -- To test with actual figures, upload images to Supabase storage via admin console.
  ('E9B05', 'What type of antenna pattern is shown in Figure E9-2?',
   '["Omnidirectional", "Cardioid", "Figure-8", "Isotropic"]'::jsonb,
   2, 'E9', 'E9B', 'Figure E9-2 shows a figure-8 pattern, which is characteristic of a dipole antenna. The nulls are off the ends of the dipole, and maximum radiation is broadside to the antenna.',
   '[{"url": "https://www.arrl.org/antenna-patterns", "title": "Understanding Antenna Patterns", "description": "Guide to reading and interpreting antenna radiation patterns", "type": "article", "siteName": "ARRL"}]'::jsonb,
   NULL,
   NULL),

  ('T7D01', 'What is the schematic symbol shown in Figure T-1?',
   '["Resistor", "Capacitor", "Inductor", "Diode"]'::jsonb,
   0, 'T7', 'T7D', 'Figure T-1 shows the schematic symbol for a resistor, represented by a zigzag line. Resistors limit current flow in a circuit and are measured in Ohms.',
   '[{"url": "https://www.electronics-tutorials.ws/resistor/res_1.html", "title": "Resistors and Resistance", "description": "Understanding resistors and their schematic symbols", "type": "article", "siteName": "Electronics Tutorials"}]'::jsonb,
   NULL,
   NULL),

  ('G7B03', 'What does the circuit shown in Figure G7-1 represent?',
   '["A low-pass filter", "A high-pass filter", "A band-pass filter", "An oscillator"]'::jsonb,
   0, 'G7', 'G7B', 'Figure G7-1 shows a low-pass filter circuit using a series inductor and shunt capacitor. This LC configuration passes low frequencies while attenuating high frequencies.',
   '[{"url": "https://www.electronics-tutorials.ws/filter/filter_2.html", "title": "Low Pass Filter Design", "description": "Understanding LC low-pass filter circuits", "type": "article", "siteName": "Electronics Tutorials"}]'::jsonb,
   NULL,
   NULL),

  ('E4C05', 'What is represented by the Smith Chart shown in Figure E4-1?',
   '["Power vs frequency", "Impedance in normalized form", "SWR vs frequency", "Gain vs frequency"]'::jsonb,
   1, 'E4', 'E4C', 'Figure E4-1 shows a Smith Chart, which displays impedance in normalized form. It is used to design matching networks and visualize complex impedances on a single graph.',
   '[{"url": "https://www.antenna-theory.com/tutorial/smith/chart.php", "title": "The Smith Chart", "description": "Interactive tutorial on using the Smith Chart", "type": "article", "siteName": "Antenna Theory"}]'::jsonb,
   NULL,
   NULL)

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SYLLABUS (subelement descriptions and exam weights)
-- Source: NCVEC Question Pool Committee
-- =============================================================================

INSERT INTO public.syllabus (code, title, license_type, type, exam_questions) VALUES
  -- Technician subelements (35 questions total)
  ('T0', 'Safety', 'T', 'subelement', 1),
  ('T1', 'Commission''s Rules', 'T', 'subelement', 6),
  ('T2', 'Operating Procedures', 'T', 'subelement', 3),
  ('T3', 'Radio Wave Characteristics', 'T', 'subelement', 3),
  ('T4', 'Amateur Radio Practices', 'T', 'subelement', 2),
  ('T5', 'Electrical Principles', 'T', 'subelement', 4),
  ('T6', 'Electronic Components', 'T', 'subelement', 4),
  ('T7', 'Station Equipment', 'T', 'subelement', 4),
  ('T8', 'Operating Activities', 'T', 'subelement', 4),
  ('T9', 'Antennas & Feed Lines', 'T', 'subelement', 4),

  -- General subelements (35 questions total)
  ('G0', 'Safety', 'G', 'subelement', 1),
  ('G1', 'Commission''s Rules', 'G', 'subelement', 5),
  ('G2', 'Operating Procedures', 'G', 'subelement', 5),
  ('G3', 'Radio Wave Propagation', 'G', 'subelement', 4),
  ('G4', 'Amateur Radio Practices', 'G', 'subelement', 5),
  ('G5', 'Electrical Principles', 'G', 'subelement', 3),
  ('G6', 'Circuit Components', 'G', 'subelement', 2),
  ('G7', 'Practical Circuits', 'G', 'subelement', 3),
  ('G8', 'Signals and Emissions', 'G', 'subelement', 3),
  ('G9', 'Antennas & Feed Lines', 'G', 'subelement', 4),

  -- Extra subelements (50 questions total)
  ('E0', 'Safety', 'E', 'subelement', 1),
  ('E1', 'Commission''s Rules', 'E', 'subelement', 6),
  ('E2', 'Operating Procedures', 'E', 'subelement', 5),
  ('E3', 'Radio Wave Propagation', 'E', 'subelement', 5),
  ('E4', 'Amateur Practices', 'E', 'subelement', 5),
  ('E5', 'Electrical Principles', 'E', 'subelement', 4),
  ('E6', 'Circuit Components', 'E', 'subelement', 6),
  ('E7', 'Practical Circuits', 'E', 'subelement', 8),
  ('E8', 'Signals and Emissions', 'E', 'subelement', 4),
  ('E9', 'Antennas & Transmission Lines', 'E', 'subelement', 6)

ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  exam_questions = EXCLUDED.exam_questions;

-- =============================================================================
-- GLOSSARY TERMS (expanded for comprehensive study)
-- =============================================================================

INSERT INTO public.glossary_terms (term, definition) VALUES
  ('Antenna', 'A device designed to transmit or receive electromagnetic waves, converting electrical signals into radio waves and vice versa.'),
  ('Bandwidth', 'The range of frequencies occupied by a signal, typically measured in Hertz (Hz).'),
  ('Carrier', 'A radio frequency signal that is modulated to carry information.'),
  ('Dipole', 'A simple antenna consisting of two equal length conductors oriented end-to-end with the feedline connected between them.'),
  ('Frequency', 'The number of complete cycles of a periodic waveform that occur per second, measured in Hertz (Hz).'),
  ('Ground Wave', 'Radio waves that travel along the surface of the Earth.'),
  ('Harmonics', 'Signals that occur at integer multiples of the fundamental frequency.'),
  ('Impedance', 'The total opposition that a circuit presents to alternating current, measured in ohms.'),
  ('Modulation', 'The process of varying a carrier wave to encode information for transmission.'),
  ('Repeater', 'An automated station that receives a signal and retransmits it, usually at higher power and from a better location to extend communication range.'),
  ('SWR', 'Standing Wave Ratio - a measure of how efficiently RF power is transmitted from a transmission line to an antenna.'),
  ('CTCSS', 'Continuous Tone-Coded Squelch System - sub-audible tones used to activate repeater receivers.'),
  ('Simplex', 'A mode of communication where stations transmit and receive on the same frequency.'),
  ('Duplex', 'A mode of communication where stations transmit and receive on different frequencies simultaneously.'),
  ('Propagation', 'The way radio waves travel from the transmitting antenna to the receiving antenna.'),
  ('Ionosphere', 'Layers of the atmosphere that can reflect or refract radio waves back to Earth.'),
  ('Skip Zone', 'The area between the end of ground wave coverage and the beginning of sky wave coverage where no signal is received.'),
  ('QSO', 'A conversation between two amateur radio operators.'),
  ('QRM', 'Man-made interference on a radio frequency.'),
  ('QRN', 'Natural noise or static interference.'),
  ('CW', 'Continuous Wave - Morse code transmissions.'),
  ('SSB', 'Single Sideband - an efficient voice transmission mode that uses half the bandwidth of AM.'),
  ('FM', 'Frequency Modulation - a transmission mode commonly used on VHF and UHF bands.'),
  ('VHF', 'Very High Frequency - radio frequencies from 30 MHz to 300 MHz.'),
  ('UHF', 'Ultra High Frequency - radio frequencies from 300 MHz to 3 GHz.'),
  ('HF', 'High Frequency - radio frequencies from 3 MHz to 30 MHz, commonly used for long-distance communication.'),
  ('Amplifier', 'A device that increases the power level of a signal.'),
  ('Attenuator', 'A device that reduces the power level of a signal.'),
  ('Oscillator', 'A circuit that produces a repetitive electronic signal.'),
  ('Transceiver', 'A device that combines both a transmitter and receiver in one unit.')
ON CONFLICT (term) DO NOTHING;

-- =============================================================================
-- EXAM SESSIONS (realistic test data for exam finder feature)
-- =============================================================================

INSERT INTO public.exam_sessions (
  title, exam_date, exam_time, sponsor, walk_ins_allowed,
  public_contact, phone, email, vec,
  location_name, address, city, state, zip,
  latitude, longitude
) VALUES
  (
    'Monthly Ham Radio Exam Session',
    CURRENT_DATE + INTERVAL '14 days',
    '10:00 AM',
    'Raleigh Amateur Radio Society',
    true,
    'John Smith',
    '919-555-1234',
    'exams@rars.org',
    'ARRL/VEC',
    'Community Center',
    '123 Main Street',
    'Raleigh',
    'NC',
    '27601',
    35.7796,
    -78.6382
  ),
  (
    'Weekend Testing Session',
    CURRENT_DATE + INTERVAL '21 days',
    '2:00 PM',
    'Durham FM Association',
    false,
    'Jane Doe',
    '919-555-5678',
    'testing@dfma.org',
    'ARRL/VEC',
    'Public Library - Meeting Room A',
    '456 Oak Avenue',
    'Durham',
    'NC',
    '27701',
    35.9940,
    -78.8986
  ),
  (
    'First Saturday Testing',
    CURRENT_DATE + INTERVAL '7 days',
    '9:00 AM',
    'Orange County Amateur Radio Club',
    true,
    'Bob Wilson',
    '919-555-9012',
    've@ocarc.org',
    'Laurel VEC',
    'Fire Station #3',
    '789 Elm Drive',
    'Chapel Hill',
    'NC',
    '27514',
    35.9132,
    -79.0558
  ),
  (
    'Evening Exam Session',
    CURRENT_DATE + INTERVAL '10 days',
    '7:00 PM',
    'Cary Amateur Radio Club',
    true,
    'Sarah Johnson',
    '919-555-3456',
    'exams@carc.net',
    'W5YI-VEC',
    'Cary Community Center',
    '321 Academy Street',
    'Cary',
    'NC',
    '27511',
    35.7915,
    -78.7811
  ),
  (
    'Online Remote Exam Session',
    CURRENT_DATE + INTERVAL '3 days',
    '6:00 PM',
    'Remote Testing Team',
    false,
    'Mike Brown',
    '800-555-TEST',
    'remote@hamexam.org',
    'ARRL/VEC',
    'Online via Zoom',
    'Virtual Location',
    'Anywhere',
    'NC',
    '00000',
    35.7796,
    -78.6382
  )
ON CONFLICT DO NOTHING;

-- =============================================================================
-- TOPICS (learning content with linked questions)
-- =============================================================================

INSERT INTO public.topics (slug, title, description, display_order, is_published, license_types, content) VALUES
  (
    'fcc-rules-basics',
    'FCC Rules and Regulations',
    'Understanding the fundamental rules governing amateur radio in the United States, including licensing, station identification, and permitted communications.',
    1,
    true,
    ARRAY['technician', 'general', 'extra'],
    '# FCC Rules and Regulations

## Introduction

The Federal Communications Commission (FCC) regulates all amateur radio operations in the United States under Part 97 of Title 47 of the Code of Federal Regulations. Understanding these rules is essential for every amateur radio operator.

## License Classes

There are three license classes in the Amateur Radio Service:

1. **Technician Class** - Entry-level license with VHF/UHF privileges and limited HF access
2. **General Class** - Intermediate license with extensive HF privileges
3. **Amateur Extra Class** - Highest class with full amateur privileges

Each license class requires passing a written examination. Higher classes include all privileges of lower classes.

## Station Identification

Amateur stations must transmit their assigned call sign at least every **10 minutes** during a communication and at the end of each communication. Your call sign must be transmitted in English using:

- Phone (voice)
- CW (Morse code)
- Digital modes

### Tactical Call Signs

You may use tactical call signs (like "Net Control" or "Mobile 1") during operations, but you must still identify with your FCC-assigned call sign every 10 minutes.

## Permitted Communications

Amateur radio is for:
- Personal communication
- Technical experimentation
- Emergency communications
- Public service

### Prohibited Communications

- Broadcasting (one-way transmissions to the general public)
- Music transmission (except incidental to authorized retransmission)
- Communications for hire or material compensation
- Obscene or indecent language

## Control Operator Requirements

Every amateur station must have a **control operator** - a licensed amateur responsible for the proper operation of the station. The control operator:

- Must hold a valid amateur license
- Is responsible for all transmissions
- May designate another licensed amateur to serve as control operator

## Power Limits

Maximum power output varies by license class and band:

| License Class | General Power Limit |
|---------------|---------------------|
| Technician | 1500W PEP (varies by band) |
| General | 1500W PEP |
| Amateur Extra | 1500W PEP |

*Note: Some bands and segments have lower power limits. Always check the band plan.*

## Key Points to Remember

1. Always identify your station every 10 minutes and at the end of transmissions
2. No broadcasting or one-way transmissions to the general public
3. A licensed control operator must be responsible for every transmission
4. Know your privileges - transmit only on frequencies your license class permits
5. Keep your license current and your address updated with the FCC

## Summary

Understanding FCC rules ensures you operate legally and responsibly. These regulations protect the amateur radio spectrum and ensure it remains available for personal, experimental, and emergency communications.'
  ),
  (
    'radio-frequency-fundamentals',
    'Radio Frequency Fundamentals',
    'Learn about radio frequencies, wavelengths, band allocations, and how different parts of the spectrum are used in amateur radio.',
    2,
    true,
    ARRAY['technician', 'general', 'extra'],
    '# Radio Frequency Fundamentals

## Introduction

Radio frequency (RF) is the foundation of amateur radio. Understanding how radio waves work, their properties, and how they''re organized is essential for effective communication.

## What is Radio Frequency?

Radio waves are a type of electromagnetic radiation with frequencies ranging from about 3 kHz to 300 GHz. Amateur radio uses portions of this spectrum allocated by the FCC.

### The Electromagnetic Spectrum

```
Low Frequency ←————————————————————→ High Frequency
    │                                      │
   VLF → LF → MF → HF → VHF → UHF → SHF → EHF
```

## Frequency and Wavelength

Frequency and wavelength are inversely related:

$$\lambda = \frac{c}{f}$$

Where:
- $\lambda$ = wavelength (in meters)
- $c$ = speed of light (300,000,000 m/s)
- $f$ = frequency (in Hz)

### Quick Conversion

| Frequency | Wavelength |
|-----------|------------|
| 3.5 MHz | 80 meters |
| 7 MHz | 40 meters |
| 14 MHz | 20 meters |
| 28 MHz | 10 meters |
| 50 MHz | 6 meters |
| 144 MHz | 2 meters |
| 440 MHz | 70 cm |

## Amateur Radio Bands

### HF Bands (High Frequency: 3-30 MHz)

HF bands are used for long-distance communication via ionospheric propagation:

- **160 meters** (1.8-2.0 MHz) - Nighttime band, limited range
- **80 meters** (3.5-4.0 MHz) - Regional, best at night
- **40 meters** (7.0-7.3 MHz) - Day and night, worldwide
- **20 meters** (14.0-14.35 MHz) - Premier DX band
- **10 meters** (28.0-29.7 MHz) - Excellent during solar maximum

### VHF/UHF Bands

These bands are primarily for local communication:

- **6 meters** (50-54 MHz) - "Magic Band" with occasional skip
- **2 meters** (144-148 MHz) - Most popular VHF band
- **70 cm** (420-450 MHz) - Most popular UHF band

## Band Plans

Band plans organize each amateur band by mode:

- **CW (Morse Code)** - Usually at the low end
- **Digital modes** - Below voice segments
- **SSB (Voice)** - Middle and upper portions
- **FM/Repeaters** - Upper portions of VHF/UHF bands

## Key Formulas

### Wavelength in Meters
$$\lambda_m = \frac{300}{f_{MHz}}$$

### Antenna Length (Half-wave dipole)
$$L_{feet} = \frac{468}{f_{MHz}}$$

## Key Points

1. Frequency and wavelength are inversely related
2. Lower frequencies generally travel farther
3. HF bands (3-30 MHz) support long-distance communication
4. VHF/UHF bands are primarily for local communication
5. Always check band plans before transmitting

## Summary

Understanding radio frequencies and how they behave is fundamental to amateur radio. This knowledge helps you choose the right band for your communication needs and set up antennas efficiently.'
  ),
  (
    'repeater-operations',
    'Repeater Operations',
    'Master the art of using repeaters including offsets, CTCSS tones, linked systems, and proper operating procedures.',
    3,
    true,
    ARRAY['technician', 'general'],
    '# Repeater Operations

## Introduction

Repeaters are automated radio stations that receive signals on one frequency and retransmit them on another, extending the range of handheld and mobile radios. They''re essential for local communication, especially in areas with challenging terrain.

## How Repeaters Work

A repeater consists of:
- **Receiver** - Listens on the input frequency
- **Transmitter** - Transmits on the output frequency
- **Controller** - Manages timing, identification, and features
- **Antenna system** - Usually at a high location

### Frequency Offset

Repeaters use two frequencies separated by a standard **offset**:

| Band | Standard Offset |
|------|-----------------|
| 2 meters (144 MHz) | ±600 kHz |
| 70 cm (440 MHz) | ±5 MHz |
| 6 meters (50 MHz) | ±500 kHz or ±1 MHz |

**Negative offset (-)**: Your transmit frequency is *below* the repeater output
**Positive offset (+)**: Your transmit frequency is *above* the repeater output

## CTCSS Tones (PL Tones)

Most repeaters require a **Continuous Tone-Coded Squelch System (CTCSS)** tone to access them. This sub-audible tone (67-254.1 Hz) prevents interference from other stations.

### Common CTCSS Tones

| Tone (Hz) | Motorola PL |
|-----------|-------------|
| 88.5 | 1B |
| 100.0 | 1Z |
| 107.2 | 2A |
| 123.0 | 3A |
| 141.3 | 4A |

*Check RepeaterBook or your local repeater directory for specific tones.*

## Proper Operating Procedures

### Making a Call

1. **Listen first** - Make sure the repeater is not in use
2. **Identify** - Give your call sign
3. **Wait** - Pause for the repeater to reset (the "courtesy tone")
4. **Call** - "This is [your call], listening" or call a specific station

### During a QSO (Conversation)

- Keep transmissions brief
- Leave pauses between transmissions for others to break in
- **Unkey the PTT button** to allow the repeater timer to reset
- Identify every 10 minutes and at the end

### Breaking In

If you need to join a conversation or make an emergency call:
- Wait for a pause between transmissions
- Say "Break" or your call sign
- Wait for acknowledgment before proceeding

## Repeater Features

### Autopatch

Some repeaters allow you to make phone calls through the repeater. This is becoming rare but may still be available.

### Linked Repeaters

Multiple repeaters can be linked together via:
- **Internet (IRLP, EchoLink, AllStar)**
- **Hardwired connections**
- **RF links**

This allows communication over very long distances.

### Time-Out Timer (TOT)

Repeaters have a timer (typically 3 minutes) that will cut off your transmission if you talk too long. This prevents:
- Accidental stuck microphones
- Single-user monopolization
- Overheating of the repeater

## Finding Repeaters

Resources for finding local repeaters:

- **RepeaterBook** (repeaterbook.com) - Comprehensive database
- **ARRL Repeater Directory** - Annual publication
- **Local radio clubs** - Know the active repeaters in your area

## Key Points

1. Know your offset and CTCSS tone before transmitting
2. Always listen before transmitting
3. Keep transmissions brief and leave pauses
4. Identify every 10 minutes and at the end of communications
5. Be courteous - repeaters are shared resources

## Summary

Repeaters extend your range and enable reliable local communication. With the right programming and proper operating procedures, you''ll be making contacts through repeaters in no time.'
  ),
  (
    'radio-wave-propagation',
    'Radio Wave Propagation',
    'Understand how radio waves travel, including line-of-sight, tropospheric ducting, ionospheric skip, and other propagation modes.',
    4,
    true,
    ARRAY['technician', 'general', 'extra'],
    '# Radio Wave Propagation

## Introduction

Propagation describes how radio waves travel from transmitter to receiver. Understanding propagation modes helps you choose the right band, time, and conditions for your communications.

## Types of Propagation

### Ground Wave

Radio waves that follow the Earth''s surface. Effective at lower frequencies (below 2 MHz) and limited to short distances at higher frequencies.

### Line of Sight (LOS)

Direct propagation between antennas that can "see" each other. Primary mode for VHF and UHF communications.

**Approximate VHF/UHF range:**
$$D_{miles} = 1.42 \times (\sqrt{h_1} + \sqrt{h_2})$$

Where $h_1$ and $h_2$ are antenna heights in feet.

### Ionospheric (Skip) Propagation

Radio waves refracted by the ionosphere, enabling long-distance HF communication.

## The Ionosphere

The ionosphere consists of several layers that affect radio propagation:

| Layer | Height | Characteristics |
|-------|--------|-----------------|
| D | 60-90 km | Absorbs HF, present during day only |
| E | 90-150 km | Supports short skip, sporadic E |
| F1 | 150-250 km | Merges with F2 at night |
| F2 | 250-400 km | Primary layer for long-distance HF |

### Ionospheric Propagation Factors

- **Time of day** - F layer stronger during daylight
- **Season** - Higher frequencies work better in summer
- **Solar cycle** - High sunspot numbers improve HF propagation
- **Geomagnetic activity** - Storms can disrupt propagation

### Maximum Usable Frequency (MUF)

The highest frequency that will reflect from the ionosphere at a given time. Frequencies above the MUF pass through to space.

## VHF/UHF Propagation Modes

### Tropospheric Ducting

Temperature inversions create "ducts" that guide VHF/UHF signals beyond normal range. Common in:
- Coastal areas
- Along weather fronts
- During stable high-pressure systems

### Sporadic E (Es)

Patches of intense ionization in the E layer that reflect VHF signals (primarily 6 meters and 2 meters) over distances of 500-1500 miles.

**Signs of Sporadic E:**
- FM broadcast band distant stations
- Skip on 10 meters
- 6-meter band "opening"

### Meteor Scatter

Brief reflections from ionized meteor trails. Useful for:
- 6 meters and 2 meters
- Very short transmissions (high-speed CW or digital)
- During meteor showers

### Aurora

Signals reflected from the aurora borealis. Causes distortion but enables VHF contacts over 500-1000+ miles.

## Propagation Indicators

### Solar Flux Index (SFI)

Measure of solar activity. Higher values (above 100) generally mean better HF propagation.

### K-Index and A-Index

Measure geomagnetic activity:
- **K-index**: 0-9 scale (0-2 is quiet, good for HF)
- **A-index**: Daily average (below 10 is good)

### Sunspot Number

More sunspots = more solar radiation = better HF propagation on higher bands.

## Band-by-Band Propagation

| Band | Best Conditions |
|------|-----------------|
| 160m | Night, winter, low noise |
| 80m | Night, regional |
| 40m | Day and night, worldwide |
| 20m | Daylight, high solar activity |
| 15m | High solar activity |
| 10m | Solar maximum, sporadic E |
| 6m | Sporadic E, tropo |
| 2m | Tropo, Es, meteor scatter |

## Key Points

1. VHF/UHF is primarily line-of-sight
2. HF propagation depends on ionospheric conditions
3. Solar activity affects HF propagation
4. Sporadic E enables occasional VHF long-distance contacts
5. Check propagation forecasts before operating

## Summary

Understanding propagation helps you work more stations and make the most of band openings. Keep an eye on solar conditions and be ready when the bands open up!'
  ),
  (
    'basic-electronics',
    'Basic Electronics for Ham Radio',
    'Essential electronics knowledge including voltage, current, resistance, capacitance, and Ohm''s Law.',
    5,
    true,
    ARRAY['technician', 'general', 'extra'],
    '# Basic Electronics for Ham Radio

## Introduction

Understanding basic electronics is essential for amateur radio operators. This knowledge helps you troubleshoot equipment, build antennas, and understand how your radio works.

## Fundamental Quantities

### Voltage (E or V)

Voltage is electrical pressure - the force that pushes electrons through a circuit. Measured in **volts (V)**.

*Analogy: Water pressure in a pipe*

### Current (I)

Current is the flow of electrons through a circuit. Measured in **amperes (A)** or milliamperes (mA).

*Analogy: Rate of water flow*

### Resistance (R)

Resistance opposes the flow of current. Measured in **ohms (Ω)**.

*Analogy: A narrow section of pipe restricting water flow*

## Ohm''s Law

The fundamental relationship between voltage, current, and resistance:

$$E = I \times R$$

Or rearranged:
$$I = \frac{E}{R}$$
$$R = \frac{E}{I}$$

### The Ohm''s Law Circle

```
      E
    ─────
    I × R
```

Cover what you want to find - the remaining formula tells you how to calculate it.

### Example Problems

**Problem 1:** A 12V battery connected to a 4Ω resistor
$$I = \frac{12V}{4Ω} = 3A$$

**Problem 2:** 2A flowing through a 100Ω resistor
$$E = 2A \times 100Ω = 200V$$

## Power

Power is the rate of energy consumption. Measured in **watts (W)**.

$$P = E \times I$$
$$P = I^2 \times R$$
$$P = \frac{E^2}{R}$$

### Example

A 12V transmitter drawing 15A:
$$P = 12V \times 15A = 180W$$

## Capacitance and Inductance

### Capacitors

Store energy in an electric field. Measured in **farads (F)**, usually microfarads (µF) or picofarads (pF).

**In circuits:**
- Block DC, pass AC
- Oppose changes in voltage
- Used for filtering and tuning

### Inductors

Store energy in a magnetic field. Measured in **henrys (H)**, usually millihenrys (mH) or microhenrys (µH).

**In circuits:**
- Block AC, pass DC
- Oppose changes in current
- Used in filters, transformers, and RF circuits

## AC vs DC

### Direct Current (DC)

Current flows in one direction only. Examples:
- Batteries
- Power supplies

### Alternating Current (AC)

Current reverses direction periodically. Characterized by:
- **Frequency** - Cycles per second (Hz)
- **Amplitude** - Peak voltage or current
- **Wavelength** - For radio frequencies

## Series and Parallel Circuits

### Resistors in Series
$$R_{total} = R_1 + R_2 + R_3...$$

### Resistors in Parallel
$$\frac{1}{R_{total}} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3}...$$

For two resistors in parallel:
$$R_{total} = \frac{R_1 \times R_2}{R_1 + R_2}$$

## Common Components

| Component | Symbol | Function |
|-----------|--------|----------|
| Resistor | ─/\/\/\/─ | Limits current |
| Capacitor | ─┤├─ | Stores charge |
| Inductor | ─⌒⌒⌒─ | Stores magnetic energy |
| Diode | ─▶│─ | One-way valve |
| Transistor | Various | Amplification, switching |

## Decibels (dB)

A logarithmic unit for expressing power ratios:

$$dB = 10 \times \log_{10}\frac{P_2}{P_1}$$

### Quick Reference

| dB Change | Power Ratio |
|-----------|-------------|
| +3 dB | 2× power |
| +6 dB | 4× power |
| +10 dB | 10× power |
| -3 dB | ½ power |
| -10 dB | 1/10 power |

## Key Points

1. Ohm''s Law: E = I × R
2. Power: P = E × I
3. Resistors in series add directly
4. Capacitors block DC, pass AC
5. Inductors block AC, pass DC
6. +3 dB = double the power

## Summary

These basic electronics concepts form the foundation for understanding radio equipment. Master Ohm''s Law and power calculations, and you''ll be well on your way to understanding more complex circuits.'
  ),
  (
    'station-setup',
    'Setting Up Your Station',
    'A practical guide to setting up your amateur radio station, including power supplies, transceivers, and mobile installations.',
    6,
    true,
    ARRAY['technician'],
    '# Setting Up Your Station

## Introduction

Setting up your first amateur radio station is exciting! This guide covers the essential components and considerations for getting on the air safely and effectively.

## Essential Station Components

### Transceiver

Your radio is the heart of the station. Options include:

- **Handheld (HT)** - Portable, 2m/70cm, 5W typical
- **Mobile** - Car-mounted, 50W typical, VHF/UHF
- **Base/Desktop** - Home station, may include HF

### Power Supply

For mobile and base stations, you need a quality power supply:

- **13.8V DC** - Standard amateur radio voltage
- **Current capacity** - Match to your radio''s requirements
- **Regulation** - Should maintain voltage under load

**Rule of thumb:** Peak current = (TX power in watts) ÷ 10 × 1.5

*Example: 100W radio needs ~15A supply*

### Antenna

No station works without an antenna! Basic options:

| Type | Band | Typical Gain |
|------|------|--------------|
| Rubber duck | VHF/UHF | 0 dBi |
| Magmount | VHF/UHF | 3-5 dBi |
| J-pole | VHF/UHF | 3 dBi |
| Yagi | VHF/UHF | 6-15 dBi |
| Dipole | HF | 2 dBi |
| Vertical | HF | 0 dBi |

### Coaxial Cable

Connects your radio to the antenna:

- **RG-58** - Thin, flexible, higher loss, good for short runs
- **RG-8X** - Medium, good balance
- **RG-213/LMR-400** - Low loss, best for longer runs or UHF

**Important:** Use quality connectors (PL-259 for HF, N-type for UHF)

## Grounding and Safety

### Station Ground

A good ground system:
- Reduces RF interference
- Protects equipment from static
- May improve antenna performance

Connect station equipment to a common ground bus, then to an external ground rod.

### Lightning Protection

- Disconnect antennas during storms
- Use lightning arrestors on antenna feedlines
- Ground antenna masts properly

### RF Safety

Be aware of RF exposure near antennas:
- Maintain safe distances during transmission
- Avoid pointing directional antennas at occupied areas
- Reduce power when necessary

## Mobile Installation

### Power Connection

**Best:** Direct connection to battery with in-line fuse
**Acceptable:** Fuse panel connection with adequate wire gauge
**Avoid:** Cigarette lighter adapter (voltage drop, noise)

### Antenna Mounting

Options for mobile antennas:
- **Magmount** - No drilling, easy to move
- **Lip mount** - Clamps to trunk/hood edge
- **NMO mount** - Permanent, best performance
- **Glass mount** - No external mounting, some signal loss

### Noise Suppression

Mobile installations may have electrical noise from:
- Alternator/charging system
- Ignition system
- Fuel pump
- Electric motors (fans, wipers)

Solutions:
- Ferrite chokes on power leads
- Capacitors on noisy components
- Proper grounding

## Basic Station Setup Checklist

1. ☐ Transceiver and microphone
2. ☐ Power supply (or battery for HT)
3. ☐ Antenna and feedline
4. ☐ SWR meter (optional but recommended)
5. ☐ Grounding system
6. ☐ Reference materials (band plans, repeater directory)

## Testing Your Setup

Before making contacts:

1. **Check SWR** - Should be below 2:1
2. **Listen first** - Receive signals to verify antenna works
3. **Low power test** - Start with low power on a simplex frequency
4. **Repeater access** - Verify you can hit local repeaters

## Programming Your Radio

Most modern radios need to be programmed with:
- Repeater frequencies and offsets
- CTCSS/DCS tones
- Memory channels

Many radios can be programmed with free software like CHIRP.

## Key Points

1. Match your power supply to your radio''s requirements
2. Use quality coax and connectors
3. Ground your station properly
4. Protect against lightning
5. Check SWR before transmitting at full power

## Summary

A well-planned station setup ensures reliable operation and protects your equipment. Start simple, add capabilities as you learn, and always prioritize safety. See you on the air!'
  )
ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content;

-- Link topics to subelements
INSERT INTO public.topic_subelements (topic_id, subelement)
SELECT t.id, s.subelement
FROM public.topics t
CROSS JOIN (VALUES ('T1'), ('G1'), ('E1')) AS s(subelement)
WHERE t.slug = 'fcc-rules-basics'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_subelements (topic_id, subelement)
SELECT t.id, s.subelement
FROM public.topics t
CROSS JOIN (VALUES ('T1'), ('T3'), ('G2')) AS s(subelement)
WHERE t.slug = 'radio-frequency-fundamentals'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_subelements (topic_id, subelement)
SELECT t.id, s.subelement
FROM public.topics t
CROSS JOIN (VALUES ('T2')) AS s(subelement)
WHERE t.slug = 'repeater-operations'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_subelements (topic_id, subelement)
SELECT t.id, s.subelement
FROM public.topics t
CROSS JOIN (VALUES ('T3'), ('G3'), ('E3')) AS s(subelement)
WHERE t.slug = 'radio-wave-propagation'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_subelements (topic_id, subelement)
SELECT t.id, s.subelement
FROM public.topics t
CROSS JOIN (VALUES ('T5'), ('G5'), ('E5')) AS s(subelement)
WHERE t.slug = 'basic-electronics'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_subelements (topic_id, subelement)
SELECT t.id, s.subelement
FROM public.topics t
CROSS JOIN (VALUES ('T4'), ('T7')) AS s(subelement)
WHERE t.slug = 'station-setup'
ON CONFLICT DO NOTHING;

-- Add resources to topics
INSERT INTO public.topic_resources (topic_id, resource_type, title, url, description, display_order)
SELECT t.id, 'article', 'FCC Part 97 Rules', 'https://www.ecfr.gov/current/title-47/chapter-I/subchapter-D/part-97', 'Official FCC rules for amateur radio service.', 1
FROM public.topics t WHERE t.slug = 'fcc-rules-basics'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_resources (topic_id, resource_type, title, url, description, display_order)
SELECT t.id, 'link', 'FCC ULS License Search', 'https://wireless2.fcc.gov/UlsApp/UlsSearch/searchLicense.jsp', 'Search for amateur radio licenses.', 2
FROM public.topics t WHERE t.slug = 'fcc-rules-basics'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_resources (topic_id, resource_type, title, url, description, display_order)
SELECT t.id, 'article', 'ARRL Band Plan', 'https://www.arrl.org/band-plan', 'Complete guide to amateur radio frequency allocations.', 1
FROM public.topics t WHERE t.slug = 'radio-frequency-fundamentals'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_resources (topic_id, resource_type, title, url, description, display_order)
SELECT t.id, 'video', 'Understanding RF Basics', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Visual explanation of radio frequency fundamentals.', 2
FROM public.topics t WHERE t.slug = 'radio-frequency-fundamentals'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_resources (topic_id, resource_type, title, url, description, display_order)
SELECT t.id, 'link', 'RepeaterBook', 'https://www.repeaterbook.com/', 'Comprehensive database of amateur radio repeaters.', 1
FROM public.topics t WHERE t.slug = 'repeater-operations'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_resources (topic_id, resource_type, title, url, description, display_order)
SELECT t.id, 'article', 'ARRL Repeater Directory', 'https://www.arrl.org/shop/2023-2024-ARRL-Repeater-Directory/', 'Official ARRL repeater directory.', 2
FROM public.topics t WHERE t.slug = 'repeater-operations'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_resources (topic_id, resource_type, title, url, description, display_order)
SELECT t.id, 'link', 'DX Info Centre - Propagation', 'https://www.dxinfocentre.com/tropo.html', 'Real-time VHF propagation forecasts.', 1
FROM public.topics t WHERE t.slug = 'radio-wave-propagation'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_resources (topic_id, resource_type, title, url, description, display_order)
SELECT t.id, 'article', 'ARRL Propagation', 'https://www.arrl.org/propagation', 'Current propagation conditions and forecasts.', 2
FROM public.topics t WHERE t.slug = 'radio-wave-propagation'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_resources (topic_id, resource_type, title, url, description, display_order)
SELECT t.id, 'video', 'Ohm''s Law Explained', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Simple explanation of Ohm''s Law for beginners.', 1
FROM public.topics t WHERE t.slug = 'basic-electronics'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_resources (topic_id, resource_type, title, url, description, display_order)
SELECT t.id, 'article', 'All About Circuits', 'https://www.allaboutcircuits.com/textbook/direct-current/', 'Comprehensive guide to DC circuit theory.', 2
FROM public.topics t WHERE t.slug = 'basic-electronics'
ON CONFLICT DO NOTHING;

INSERT INTO public.topic_resources (topic_id, resource_type, title, url, description, display_order)
SELECT t.id, 'article', 'Choosing Your First Radio', 'https://www.arrl.org/shop/Choosing-a-Ham-Radio', 'Guide to selecting your first amateur radio.', 1
FROM public.topics t WHERE t.slug = 'station-setup'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- TOPIC-QUESTION ASSOCIATIONS
-- Links questions to their relevant learning topics
-- =============================================================================

-- FCC Rules topic - link to T1 questions
INSERT INTO public.topic_questions (topic_id, question_id)
SELECT t.id, q.id
FROM public.topics t, public.questions q
WHERE t.slug = 'fcc-rules-basics'
  AND q.display_name IN ('T1A01', 'T1A02', 'T1A03', 'T1A04', 'T1A05', 'T1B01', 'T1B02', 'T1C01', 'T1C02', 'T1C03', 'T1D01', 'T1D02', 'G1A01')
ON CONFLICT DO NOTHING;

-- Radio Frequency Fundamentals topic - link to frequency-related questions
INSERT INTO public.topic_questions (topic_id, question_id)
SELECT t.id, q.id
FROM public.topics t, public.questions q
WHERE t.slug = 'radio-frequency-fundamentals'
  AND q.display_name IN ('T1B03', 'T1B04', 'T1B05', 'T3B01', 'T3B02')
ON CONFLICT DO NOTHING;

-- Repeater Operations topic - link to T2 questions
INSERT INTO public.topic_questions (topic_id, question_id)
SELECT t.id, q.id
FROM public.topics t, public.questions q
WHERE t.slug = 'repeater-operations'
  AND q.display_name IN ('T2A01', 'T2A02', 'T2A03', 'T2A04', 'T2A05', 'T2B01', 'T2B02', 'T2B03')
ON CONFLICT DO NOTHING;

-- Radio Wave Propagation topic - link to T3 questions
INSERT INTO public.topic_questions (topic_id, question_id)
SELECT t.id, q.id
FROM public.topics t, public.questions q
WHERE t.slug = 'radio-wave-propagation'
  AND q.display_name IN ('T3A01', 'T3A02', 'T3A03', 'T3B01', 'T3B02')
ON CONFLICT DO NOTHING;

-- Basic Electronics topic - link to T5 questions
INSERT INTO public.topic_questions (topic_id, question_id)
SELECT t.id, q.id
FROM public.topics t, public.questions q
WHERE t.slug = 'basic-electronics'
  AND q.display_name IN ('T5A01', 'T5A02', 'T5A03', 'T5B01', 'T5B02', 'T5C01', 'T5C02')
ON CONFLICT DO NOTHING;

-- Station Setup topic - link to T4 questions
INSERT INTO public.topic_questions (topic_id, question_id)
SELECT t.id, q.id
FROM public.topics t, public.questions q
WHERE t.slug = 'station-setup'
  AND q.display_name IN ('T4A01', 'T4A02', 'T4B01', 'T4B02')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ARRL TEXTBOOK CHAPTERS (Sample chapters for each license type)
-- =============================================================================

-- Technician ARRL Ham Radio License Manual chapters
INSERT INTO public.arrl_chapters (license_type, chapter_number, title, description, display_order) VALUES
  ('T', 1, 'Welcome to Amateur Radio', 'Introduction to ham radio, its history, and the amateur radio community', 1),
  ('T', 2, 'Radio and Signals Fundamentals', 'Basic concepts of radio waves, frequencies, and signal propagation', 2),
  ('T', 3, 'Electricity, Components, and Circuits', 'Electrical principles, components like resistors and capacitors, and basic circuits', 3),
  ('T', 4, 'Propagation, Antennas, and Feed Lines', 'How radio signals travel and antenna basics', 4),
  ('T', 5, 'Amateur Radio Equipment', 'Transceivers, receivers, and station accessories', 5),
  ('T', 6, 'Communicating With Other Hams', 'Operating procedures, phonetics, and making contacts', 6),
  ('T', 7, 'Licensing Regulations', 'FCC rules, privileges, and license classes', 7),
  ('T', 8, 'Operating Regulations', 'Band plans, identification requirements, and prohibited practices', 8),
  ('T', 9, 'Safety', 'RF safety, electrical safety, and tower safety', 9)
ON CONFLICT (license_type, chapter_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- General ARRL Ham Radio License Manual chapters
INSERT INTO public.arrl_chapters (license_type, chapter_number, title, description, display_order) VALUES
  ('G', 1, 'Procedures and Practices', 'General operating procedures and best practices', 1),
  ('G', 2, 'Rules and Regulations', 'FCC rules specific to General class privileges', 2),
  ('G', 3, 'Components and Circuits', 'Advanced component theory and circuit design', 3),
  ('G', 4, 'Radio Signals and Equipment', 'Receivers, transmitters, and transceivers', 4),
  ('G', 5, 'Electrical and RF Safety', 'Advanced safety considerations', 5),
  ('G', 6, 'Antennas and Feed Lines', 'Antenna design, construction, and transmission lines', 6),
  ('G', 7, 'Propagation', 'HF propagation modes, skip, and ionospheric effects', 7),
  ('G', 8, 'Digital Modes', 'Digital communication modes and protocols', 8)
ON CONFLICT (license_type, chapter_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Extra ARRL Ham Radio License Manual chapters
INSERT INTO public.arrl_chapters (license_type, chapter_number, title, description, display_order) VALUES
  ('E', 1, 'Operating Standards and Practices', 'Advanced operating techniques and DXing', 1),
  ('E', 2, 'Rules and Regulations', 'International regulations and advanced FCC rules', 2),
  ('E', 3, 'Radio Signals and Measurements', 'Modulation, signal analysis, and test equipment', 3),
  ('E', 4, 'Components and Building Blocks', 'Advanced components, semiconductors, and ICs', 4),
  ('E', 5, 'Radio Circuits', 'Oscillators, filters, and amplifier design', 5),
  ('E', 6, 'Antennas', 'Advanced antenna theory and design', 6),
  ('E', 7, 'Transmission Lines', 'Transmission line theory and matching', 7),
  ('E', 8, 'Topics in Radio Propagation', 'Advanced propagation analysis and prediction', 8),
  ('E', 9, 'Safety', 'RF exposure evaluation and compliance', 9)
ON CONFLICT (license_type, chapter_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- =============================================================================
-- LINK QUESTIONS TO ARRL CHAPTERS (with page references)
-- =============================================================================

-- Link Technician T1 questions to Chapter 7 (Licensing Regulations) with page refs
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 7),
  arrl_page_reference = '7-1 to 7-8'
WHERE display_name IN ('T1A01', 'T1A02', 'T1A03', 'T1A04', 'T1A05');

UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 7),
  arrl_page_reference = '7-9 to 7-15'
WHERE display_name IN ('T1B01', 'T1B02', 'T1B03', 'T1B04', 'T1B05');

UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 7),
  arrl_page_reference = '7-16 to 7-22'
WHERE display_name IN ('T1C01', 'T1C02', 'T1C03');

UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 8),
  arrl_page_reference = '8-1 to 8-10'
WHERE display_name IN ('T1D01', 'T1D02');

-- Link T2 questions to Chapter 6 (Communicating With Other Hams)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 6),
  arrl_page_reference = '6-1 to 6-12'
WHERE display_name IN ('T2A01', 'T2A02', 'T2A03', 'T2A04', 'T2A05');

UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 6),
  arrl_page_reference = '6-13 to 6-20'
WHERE display_name IN ('T2B01', 'T2B02', 'T2B03');

-- Link T3 questions to Chapter 2 (Radio and Signals Fundamentals)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 2),
  arrl_page_reference = '2-5 to 2-15'
WHERE display_name IN ('T3A01', 'T3A02', 'T3A03');

UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 2),
  arrl_page_reference = '2-16 to 2-25'
WHERE display_name IN ('T3B01', 'T3B02');

-- Link T4 questions to Chapter 5 (Amateur Radio Equipment)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 5),
  arrl_page_reference = '5-1 to 5-10'
WHERE display_name IN ('T4A01', 'T4A02');

UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 5),
  arrl_page_reference = '5-11 to 5-20'
WHERE display_name IN ('T4B01', 'T4B02');

-- Link T5 questions to Chapter 3 (Electricity, Components, and Circuits)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 3),
  arrl_page_reference = '3-1 to 3-12'
WHERE display_name LIKE 'T5A%';

UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 3),
  arrl_page_reference = '3-13 to 3-22'
WHERE display_name LIKE 'T5B%';

UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 3),
  arrl_page_reference = '3-23 to 3-30'
WHERE display_name LIKE 'T5C%';

-- Link T6 questions to Chapter 3 as well (Electronic Components)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 3),
  arrl_page_reference = '3-31 to 3-42'
WHERE display_name LIKE 'T6%';

-- Link T7 questions to Chapter 5 (Amateur Radio Equipment)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 5),
  arrl_page_reference = '5-21 to 5-35'
WHERE display_name LIKE 'T7%';

-- Link T8 questions to Chapter 6 (Communicating With Other Hams)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 6),
  arrl_page_reference = '6-21 to 6-35'
WHERE display_name LIKE 'T8%';

-- Link T9 questions to Chapter 4 (Propagation, Antennas, and Feed Lines)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 4),
  arrl_page_reference = '4-1 to 4-20'
WHERE display_name LIKE 'T9%';

-- Link T0 (Safety) questions to Chapter 9 (Safety)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'T' AND chapter_number = 9),
  arrl_page_reference = '9-1 to 9-15'
WHERE display_name LIKE 'T0%';

-- Link General G1 questions to Chapter 2 (Rules and Regulations)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'G' AND chapter_number = 2),
  arrl_page_reference = '2-1 to 2-20'
WHERE display_name LIKE 'G1%';

-- Link General G2 questions to Chapter 1 (Procedures and Practices)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'G' AND chapter_number = 1),
  arrl_page_reference = '1-1 to 1-25'
WHERE display_name LIKE 'G2%';

-- Link General G3 questions to Chapter 7 (Propagation)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'G' AND chapter_number = 7),
  arrl_page_reference = '7-1 to 7-18'
WHERE display_name LIKE 'G3%';

-- Link General G4 questions to Chapter 4 (Radio Signals and Equipment)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'G' AND chapter_number = 4),
  arrl_page_reference = '4-1 to 4-25'
WHERE display_name LIKE 'G4%';

-- Link General G5 questions to Chapter 3 (Components and Circuits)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'G' AND chapter_number = 3),
  arrl_page_reference = '3-1 to 3-30'
WHERE display_name LIKE 'G5%';

-- Link General G9 questions to Chapter 6 (Antennas and Feed Lines)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'G' AND chapter_number = 6),
  arrl_page_reference = '6-1 to 6-25'
WHERE display_name LIKE 'G9%';

-- Link General G0 (Safety) questions to Chapter 5 (Electrical and RF Safety)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'G' AND chapter_number = 5),
  arrl_page_reference = '5-1 to 5-15'
WHERE display_name LIKE 'G0%';

-- Link Extra E1 questions to Chapter 2 (Rules and Regulations)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'E' AND chapter_number = 2),
  arrl_page_reference = '2-1 to 2-25'
WHERE display_name LIKE 'E1%';

-- Link Extra E2 questions to Chapter 1 (Operating Standards and Practices)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'E' AND chapter_number = 1),
  arrl_page_reference = '1-1 to 1-30'
WHERE display_name LIKE 'E2%';

-- Link Extra E5 questions to Chapter 5 (Radio Circuits)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'E' AND chapter_number = 5),
  arrl_page_reference = '5-1 to 5-35'
WHERE display_name LIKE 'E5%';

-- Link Extra E9 questions to Chapter 6 (Antennas)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'E' AND chapter_number = 6),
  arrl_page_reference = '6-1 to 6-30'
WHERE display_name LIKE 'E9%';

-- Link Extra E0 (Safety) questions to Chapter 9 (Safety)
UPDATE public.questions SET
  arrl_chapter_id = (SELECT id FROM public.arrl_chapters WHERE license_type = 'E' AND chapter_number = 9),
  arrl_page_reference = '9-1 to 9-20'
WHERE display_name LIKE 'E0%';

-- =============================================================================
-- LESSONS (Ordered groups of topics)
-- =============================================================================

-- Create lessons
INSERT INTO public.lessons (slug, title, description, display_order, is_published, license_types) VALUES
  (
    'getting-started-with-ham-radio',
    'Getting Started with Ham Radio',
    'Your first steps into amateur radio. Learn the essential regulations and set up your station.',
    1,
    true,
    ARRAY['technician']
  ),
  (
    'understanding-radio-waves',
    'Understanding Radio Waves',
    'Dive deep into how radio waves work, from frequencies to propagation methods.',
    2,
    true,
    ARRAY['technician', 'general', 'extra']
  ),
  (
    'technician-foundations',
    'Technician Foundations',
    'Core knowledge every Technician class operator needs. Complete this lesson to build a solid foundation.',
    3,
    true,
    ARRAY['technician']
  ),
  (
    'general-upgrade-path',
    'General Class Upgrade Path',
    'Topics to master when upgrading from Technician to General class license.',
    4,
    true,
    ARRAY['general']
  ),
  (
    'electronics-essentials',
    'Electronics Essentials',
    'Understanding the electronic principles behind amateur radio equipment.',
    5,
    true,
    ARRAY['technician', 'general', 'extra']
  )
ON CONFLICT (slug) DO NOTHING;

-- Link topics to lessons (order matters - display_order determines sequence)
-- Lesson 1: Getting Started with Ham Radio (Technician)
INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 0
FROM public.lessons l, public.topics t
WHERE l.slug = 'getting-started-with-ham-radio' AND t.slug = 'fcc-rules-basics'
ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 1
FROM public.lessons l, public.topics t
WHERE l.slug = 'getting-started-with-ham-radio' AND t.slug = 'station-setup'
ON CONFLICT DO NOTHING;

-- Lesson 2: Understanding Radio Waves
INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 0
FROM public.lessons l, public.topics t
WHERE l.slug = 'understanding-radio-waves' AND t.slug = 'radio-frequency-fundamentals'
ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 1
FROM public.lessons l, public.topics t
WHERE l.slug = 'understanding-radio-waves' AND t.slug = 'radio-wave-propagation'
ON CONFLICT DO NOTHING;

-- Lesson 3: Technician Foundations
INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 0
FROM public.lessons l, public.topics t
WHERE l.slug = 'technician-foundations' AND t.slug = 'fcc-rules-basics'
ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 1
FROM public.lessons l, public.topics t
WHERE l.slug = 'technician-foundations' AND t.slug = 'basic-electronics'
ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 2
FROM public.lessons l, public.topics t
WHERE l.slug = 'technician-foundations' AND t.slug = 'repeater-operations'
ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 3
FROM public.lessons l, public.topics t
WHERE l.slug = 'technician-foundations' AND t.slug = 'station-setup'
ON CONFLICT DO NOTHING;

-- Lesson 4: General Upgrade Path
INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 0
FROM public.lessons l, public.topics t
WHERE l.slug = 'general-upgrade-path' AND t.slug = 'radio-wave-propagation'
ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 1
FROM public.lessons l, public.topics t
WHERE l.slug = 'general-upgrade-path' AND t.slug = 'basic-electronics'
ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 2
FROM public.lessons l, public.topics t
WHERE l.slug = 'general-upgrade-path' AND t.slug = 'fcc-rules-basics'
ON CONFLICT DO NOTHING;

-- Lesson 5: Electronics Essentials
INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 0
FROM public.lessons l, public.topics t
WHERE l.slug = 'electronics-essentials' AND t.slug = 'basic-electronics'
ON CONFLICT DO NOTHING;

INSERT INTO public.lesson_topics (lesson_id, topic_id, display_order)
SELECT l.id, t.id, 1
FROM public.lessons l, public.topics t
WHERE l.slug = 'electronics-essentials' AND t.slug = 'radio-frequency-fundamentals'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- READINESS SCORING CONFIG
-- Default formula parameters for the readiness scoring model.
-- These can be adjusted via admin or direct DB access to tune the algorithm.
-- =============================================================================

INSERT INTO public.readiness_config (key, value, description) VALUES
  ('formula_weights', '{"recent_accuracy": 35, "overall_accuracy": 20, "coverage": 15, "mastery": 15, "test_rate": 15}', 'Weights for readiness score components (must sum to 100)'),
  ('pass_probability', '{"k": 0.15, "r0": 65}', 'Logistic curve parameters: k=steepness, r0=inflection point'),
  ('recency_penalty', '{"max_penalty": 10, "decay_rate": 0.5}', 'Days-since-study penalty: penalty = min(max_penalty, decay_rate * days)'),
  ('coverage_beta', '{"low": 1.2, "mid": 1.0, "high": 0.9, "low_threshold": 0.3, "high_threshold": 0.7}', 'Coverage modifier for subelement risk score'),
  ('blend', '{"min_recent_for_blend": 5, "recent_window": 20}', 'Accuracy blend formula: min_recent_for_blend=threshold to start blending, recent_window=full weight threshold'),
  ('thresholds', '{"min_attempts": 50, "min_per_subelement": 2, "recent_window": 50, "subelement_recent_window": 20}', 'Sample size thresholds for confidence'),
  ('client_recalc', '{"question_batch_size": 10, "debounce_ms": 5000}', 'Client-side recalculation settings: batch questions before recalc, minimum time between recalcs'),
  ('version', '"v1.0.0"', 'Current formula version for audit trail')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- =============================================================================
-- HAM RADIO TOOL CATEGORIES
-- =============================================================================

INSERT INTO public.ham_radio_tool_categories (name, slug, description, display_order, icon_name) VALUES
  ('Digital Modes', 'digital-modes', 'Software for FT8, JS8Call, RTTY, and other digital modes', 1, 'Radio'),
  ('Logging', 'logging', 'Station logging software and online logbook services', 2, 'ClipboardList'),
  ('Propagation', 'propagation', 'Band conditions, propagation prediction, and solar data', 3, 'Globe'),
  ('Antenna Design', 'antenna-design', 'Antenna modeling, calculators, and design tools', 4, 'Antenna'),
  ('SDR Software', 'sdr-software', 'Software defined radio applications', 5, 'Cpu'),
  ('Repeater Directories', 'repeater-directories', 'Find local repeaters and link systems', 6, 'MapPin'),
  ('Callsign Lookup', 'callsign-lookup', 'Callsign databases and QRZ lookup tools', 7, 'Search'),
  ('Contest Tools', 'contest-tools', 'Contest logging, scoring, and resources', 8, 'Trophy')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- HAM RADIO TOOLS
-- =============================================================================

INSERT INTO public.ham_radio_tools (category_id, title, description, url, is_published, display_order)
SELECT c.id, 'WSJT-X',
  'Weak signal communication software supporting FT8, FT4, JT65, and other digital modes. Essential for modern digital amateur radio operation.',
  'https://wsjt.sourceforge.io/', true, 1
FROM public.ham_radio_tool_categories c WHERE c.slug = 'digital-modes';

INSERT INTO public.ham_radio_tools (category_id, title, description, url, is_published, display_order)
SELECT c.id, 'JS8Call',
  'Keyboard-to-keyboard messaging using JS8 mode. Designed for weak signal communication with store-and-forward capability.',
  'http://js8call.com/', true, 2
FROM public.ham_radio_tool_categories c WHERE c.slug = 'digital-modes';

INSERT INTO public.ham_radio_tools (category_id, title, description, url, is_published, display_order)
SELECT c.id, 'fldigi',
  'Digital modem program supporting over 80 digital modes including PSK31, RTTY, CW, and many more.',
  'http://www.w1hkj.com/', true, 3
FROM public.ham_radio_tool_categories c WHERE c.slug = 'digital-modes';

INSERT INTO public.ham_radio_tools (category_id, title, description, url, is_published, display_order)
SELECT c.id, 'Log4OM',
  'Free logging software with DX cluster integration, QSL management, and awards tracking.',
  'https://www.log4om.com/', true, 1
FROM public.ham_radio_tool_categories c WHERE c.slug = 'logging';

INSERT INTO public.ham_radio_tools (category_id, title, description, url, is_published, display_order)
SELECT c.id, 'CloudLog',
  'Self-hosted, web-based amateur radio logging application. Access your log from anywhere.',
  'https://www.cloudlog.co.uk/', true, 2
FROM public.ham_radio_tool_categories c WHERE c.slug = 'logging';

INSERT INTO public.ham_radio_tools (category_id, title, description, url, is_published, display_order)
SELECT c.id, 'PSK Reporter',
  'Real-time propagation monitoring showing where digital signals are being received worldwide.',
  'https://pskreporter.info/', true, 1
FROM public.ham_radio_tool_categories c WHERE c.slug = 'propagation';

INSERT INTO public.ham_radio_tools (category_id, title, description, url, is_published, display_order)
SELECT c.id, 'VOACAP Online',
  'HF propagation prediction tool. Plan your contacts by seeing predicted signal strength.',
  'https://www.voacap.com/', true, 2
FROM public.ham_radio_tool_categories c WHERE c.slug = 'propagation';

INSERT INTO public.ham_radio_tools (category_id, title, description, url, is_published, display_order)
SELECT c.id, '4NEC2',
  'Free antenna modeling software for designing and analyzing antenna patterns and performance.',
  'https://www.qsl.net/4nec2/', true, 1
FROM public.ham_radio_tool_categories c WHERE c.slug = 'antenna-design';

INSERT INTO public.ham_radio_tools (category_id, title, description, url, is_published, display_order)
SELECT c.id, 'SDR++',
  'Cross-platform SDR software with support for many receivers. Modern UI with waterfall display.',
  'https://www.sdrpp.org/', true, 1
FROM public.ham_radio_tool_categories c WHERE c.slug = 'sdr-software';

INSERT INTO public.ham_radio_tools (category_id, title, description, url, is_published, display_order)
SELECT c.id, 'RepeaterBook',
  'Comprehensive database of amateur radio repeaters worldwide with search and filtering.',
  'https://www.repeaterbook.com/', true, 1
FROM public.ham_radio_tool_categories c WHERE c.slug = 'repeater-directories';

INSERT INTO public.ham_radio_tools (category_id, title, description, url, is_published, display_order)
SELECT c.id, 'QRZ.com',
  'The most popular callsign lookup database. Find contact info, QSL routes, and station details.',
  'https://www.qrz.com/', true, 1
FROM public.ham_radio_tool_categories c WHERE c.slug = 'callsign-lookup';

INSERT INTO public.ham_radio_tools (category_id, title, description, url, is_published, display_order)
SELECT c.id, 'N1MM Logger+',
  'Free contest logging software. Industry standard for amateur radio contests with real-time scoring.',
  'https://n1mmwp.hamdocs.com/', true, 1
FROM public.ham_radio_tool_categories c WHERE c.slug = 'contest-tools';

-- =============================================================================
-- SYSTEM MONITORING ALERTS (Development Seed Data)
-- =============================================================================

-- Sample alerts with various statuses and severities for development testing
-- These alerts demonstrate the different states admins will encounter

-- Get rule IDs for linking alerts
DO $$
DECLARE
  v_error_rate_rule_id UUID;
  v_timeout_rule_id UUID;
  v_consecutive_rule_id UUID;
  v_db_connection_rule_id UUID;
BEGIN
  -- Get rule IDs
  SELECT id INTO v_error_rate_rule_id FROM public.alert_rules WHERE name = 'High Error Rate' LIMIT 1;
  SELECT id INTO v_timeout_rule_id FROM public.alert_rules WHERE name = 'Timeout Pattern Detection' LIMIT 1;
  SELECT id INTO v_consecutive_rule_id FROM public.alert_rules WHERE name = 'Consecutive Function Failures' LIMIT 1;
  SELECT id INTO v_db_connection_rule_id FROM public.alert_rules WHERE name = 'Database Connection Errors' LIMIT 1;

  -- Alert 1: Critical pending alert (most urgent)
  INSERT INTO public.alerts (
    rule_id, title, message, severity, status, context, created_at, updated_at
  ) VALUES (
    v_error_rate_rule_id,
    'High Error Rate: 12 errors in 15 minutes',
    'Detected 12 errors (threshold: 5) in the last 15 minutes. Affected functions: calculate-readiness, sync-discourse.',
    'critical',
    'pending',
    '{
      "function_names": ["calculate-readiness", "sync-discourse"],
      "error_count": 12,
      "sample_errors": [
        "Error: Database connection timeout after 30000ms",
        "Error: Failed to fetch user data: connection refused",
        "Error: Query failed: too many connections"
      ],
      "time_window_start": "2026-01-20T11:30:00Z",
      "time_window_end": "2026-01-20T11:45:00Z"
    }'::jsonb,
    NOW() - INTERVAL '25 minutes',
    NOW() - INTERVAL '25 minutes'
  );

  -- Alert 2: Warning pending alert
  INSERT INTO public.alerts (
    rule_id, title, message, severity, status, context, created_at, updated_at
  ) VALUES (
    v_timeout_rule_id,
    'Timeout Pattern Detection: Pattern detected in 3 error(s)',
    'Detected 3 error(s) matching pattern "timeout|timed out". Affected functions: sync-discourse.',
    'warning',
    'pending',
    '{
      "function_names": ["sync-discourse"],
      "error_count": 3,
      "sample_errors": [
        "Request timed out after 30s waiting for Discourse API",
        "Connection timeout: unable to reach forum.openhamprep.com"
      ],
      "matched_pattern": "timeout|timed out",
      "time_window_end": "2026-01-20T11:50:00Z"
    }'::jsonb,
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '15 minutes'
  );

  -- Alert 3: Acknowledged alert (admin has seen it)
  INSERT INTO public.alerts (
    rule_id, title, message, severity, status, context,
    acknowledged_at, acknowledgment_note,
    created_at, updated_at
  ) VALUES (
    v_consecutive_rule_id,
    'Consecutive Function Failures: 1 function(s) failing consecutively',
    'Detected 1 function(s) with 3+ consecutive failures. Functions: calculate-readiness. Max consecutive: 4.',
    'critical',
    'acknowledged',
    '{
      "function_names": ["calculate-readiness"],
      "consecutive_failures": 4,
      "sample_errors": [
        "Error: Cannot read property ''user_id'' of undefined",
        "TypeError: null is not an object",
        "Error: Unexpected end of JSON input"
      ],
      "time_window_end": "2026-01-20T10:30:00Z"
    }'::jsonb,
    NOW() - INTERVAL '1 hour',
    'Investigating - appears to be related to the recent deployment. Rolling back.',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour'
  );

  -- Alert 4: Resolved alert (manually resolved)
  INSERT INTO public.alerts (
    rule_id, title, message, severity, status, context,
    acknowledged_at, acknowledgment_note,
    resolved_at, auto_resolved,
    created_at, updated_at
  ) VALUES (
    v_db_connection_rule_id,
    'Database Connection Errors: Pattern detected in 5 error(s)',
    'Detected 5 error(s) matching pattern "connection refused|ECONNREFUSED". Affected functions: calculate-readiness.',
    'critical',
    'resolved',
    '{
      "function_names": ["calculate-readiness"],
      "error_count": 5,
      "sample_errors": [
        "Error: ECONNREFUSED - Connection refused to database",
        "Error: connection pool exhausted"
      ],
      "matched_pattern": "connection refused|ECONNREFUSED|too many connections|connection pool",
      "time_window_end": "2026-01-20T08:00:00Z"
    }'::jsonb,
    NOW() - INTERVAL '5 hours',
    'Database was restarted during maintenance window.',
    NOW() - INTERVAL '4 hours',
    false,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '4 hours'
  );

  -- Alert 5: Auto-resolved alert
  INSERT INTO public.alerts (
    rule_id, title, message, severity, status, context,
    resolved_at, auto_resolved,
    created_at, updated_at
  ) VALUES (
    v_error_rate_rule_id,
    'High Error Rate: 6 errors in 15 minutes',
    'Detected 6 errors (threshold: 5) in the last 15 minutes. Affected functions: sync-discourse.',
    'critical',
    'resolved',
    '{
      "function_names": ["sync-discourse"],
      "error_count": 6,
      "sample_errors": [
        "Error: Discourse API rate limited (429)"
      ],
      "time_window_start": "2026-01-19T14:00:00Z",
      "time_window_end": "2026-01-19T14:15:00Z"
    }'::jsonb,
    NOW() - INTERVAL '1 day',
    true,
    NOW() - INTERVAL '1 day' - INTERVAL '30 minutes',
    NOW() - INTERVAL '1 day'
  );

  -- Alert 6: Info-level pending alert
  INSERT INTO public.alerts (
    rule_id, title, message, severity, status, context, created_at, updated_at
  ) VALUES (
    NULL,  -- Manual alert, no rule
    'System Monitor: First successful run',
    'The system monitor completed its first successful run after deployment.',
    'info',
    'pending',
    '{
      "logs_analyzed": 150,
      "rules_evaluated": 5,
      "duration_ms": 1234
    }'::jsonb,
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '10 minutes'
  );

END $$;

-- Sample system monitor runs for history display
INSERT INTO public.system_monitor_runs (
  started_at, completed_at, rules_evaluated, alerts_created, alerts_auto_resolved,
  logs_analyzed, duration_ms, status
) VALUES
  (NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes' + INTERVAL '2 seconds', 5, 0, 0, 42, 1823, 'completed'),
  (NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes' + INTERVAL '1 second', 5, 1, 0, 38, 1456, 'completed'),
  (NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes' + INTERVAL '3 seconds', 5, 0, 0, 51, 2134, 'completed'),
  (NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes' + INTERVAL '2 seconds', 5, 2, 0, 67, 1987, 'completed'),
  (NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes' + INTERVAL '1 second', 5, 0, 1, 45, 1654, 'completed'),
  (NOW() - INTERVAL '30 minutes', NULL, 5, NULL, NULL, NULL, NULL, 'failed'),
  (NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '35 minutes' + INTERVAL '2 seconds', 5, 1, 0, 52, 1789, 'completed'),
  (NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '40 minutes' + INTERVAL '1 second', 5, 0, 0, 39, 1432, 'completed');

-- Add error message to the failed run
UPDATE public.system_monitor_runs
SET error_message = 'Error: Failed to fetch Edge Function logs: Management API returned 503'
WHERE status = 'failed';

-- =============================================================================
-- DAILY STREAKS - Helper function for testing
-- =============================================================================
-- Daily streak data is automatically created when users study (via triggers).
-- This helper function can be called AFTER a user signs up to seed sample
-- streak data for testing the UI without having to answer 5+ questions.
--
-- Usage (run in Supabase Studio SQL Editor after signing up):
--   SELECT seed_streak_data_for_user('your-user-id-here');
--
-- To find your user ID:
--   1. Go to Authentication > Users in Supabase Studio
--   2. Copy the UUID of your test user
-- =============================================================================

CREATE OR REPLACE FUNCTION public.seed_streak_data_for_user(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_profile_exists BOOLEAN;
BEGIN
  -- Verify user has a profile
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    RETURN 'Error: No profile found for user ' || p_user_id || '. Make sure the user has signed up.';
  END IF;

  -- Seed daily activity for the past 7 days (creating a 7-day streak)
  INSERT INTO public.daily_activity (user_id, activity_date, questions_answered, questions_correct, tests_taken, tests_passed, glossary_terms_studied)
  VALUES
    (p_user_id, CURRENT_DATE - 6, 12, 10, 1, 1, 5),   -- 6 days ago: test + questions
    (p_user_id, CURRENT_DATE - 5, 8, 6, 0, 0, 0),    -- 5 days ago: questions only
    (p_user_id, CURRENT_DATE - 4, 15, 12, 0, 0, 3),  -- 4 days ago: questions + some glossary
    (p_user_id, CURRENT_DATE - 3, 5, 4, 0, 0, 0),    -- 3 days ago: exactly 5 questions
    (p_user_id, CURRENT_DATE - 2, 0, 0, 1, 0, 0),    -- 2 days ago: test only (failed)
    (p_user_id, CURRENT_DATE - 1, 10, 8, 1, 1, 0),   -- Yesterday: test + questions
    (p_user_id, CURRENT_DATE, 3, 2, 0, 0, 0)         -- Today: 3 questions (not yet qualified)
  ON CONFLICT (user_id, activity_date) DO UPDATE SET
    questions_answered = EXCLUDED.questions_answered,
    questions_correct = EXCLUDED.questions_correct,
    tests_taken = EXCLUDED.tests_taken,
    tests_passed = EXCLUDED.tests_passed,
    glossary_terms_studied = EXCLUDED.glossary_terms_studied,
    updated_at = now();

  -- Set streak state (7-day current streak, since all past days qualified)
  INSERT INTO public.daily_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_freezes_available)
  VALUES (p_user_id, 7, 7, CURRENT_DATE - 1, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = 7,
    longest_streak = GREATEST(daily_streaks.longest_streak, 7),
    last_activity_date = CURRENT_DATE - 1,
    updated_at = now();

  RETURN 'Success! Seeded 7-day streak for user ' || p_user_id || '. Today shows 3/5 questions (streak at risk).';
END;
$$;

-- Alternative: Seed a "streak at risk" scenario (user had a streak but hasn't studied today)
CREATE OR REPLACE FUNCTION public.seed_streak_at_risk_for_user(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_profile_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    RETURN 'Error: No profile found for user ' || p_user_id;
  END IF;

  -- Seed activity for past days only (no activity today)
  INSERT INTO public.daily_activity (user_id, activity_date, questions_answered, questions_correct, tests_taken, tests_passed)
  VALUES
    (p_user_id, CURRENT_DATE - 3, 10, 8, 0, 0),
    (p_user_id, CURRENT_DATE - 2, 7, 5, 1, 1),
    (p_user_id, CURRENT_DATE - 1, 6, 5, 0, 0)
  ON CONFLICT (user_id, activity_date) DO UPDATE SET
    questions_answered = EXCLUDED.questions_answered,
    questions_correct = EXCLUDED.questions_correct,
    tests_taken = EXCLUDED.tests_taken,
    tests_passed = EXCLUDED.tests_passed,
    updated_at = now();

  -- Delete today's activity if any exists
  DELETE FROM public.daily_activity WHERE user_id = p_user_id AND activity_date = CURRENT_DATE;

  INSERT INTO public.daily_streaks (user_id, current_streak, longest_streak, last_activity_date)
  VALUES (p_user_id, 3, 5, CURRENT_DATE - 1)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = 3,
    longest_streak = GREATEST(daily_streaks.longest_streak, 5),
    last_activity_date = CURRENT_DATE - 1,
    updated_at = now();

  RETURN 'Success! User has a 3-day streak at risk (no activity today). Best streak: 5 days.';
END;
$$;

-- Alternative: Seed a fresh start (no streak yet)
CREATE OR REPLACE FUNCTION public.seed_no_streak_for_user(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_profile_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    RETURN 'Error: No profile found for user ' || p_user_id;
  END IF;

  -- Clear any existing streak data
  DELETE FROM public.daily_activity WHERE user_id = p_user_id;
  DELETE FROM public.daily_streaks WHERE user_id = p_user_id;

  RETURN 'Success! Cleared all streak data for user. They will start fresh.';
END;
$$;

-- Grant execute to authenticated users (for testing via app)
GRANT EXECUTE ON FUNCTION public.seed_streak_data_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_streak_at_risk_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_no_streak_for_user TO authenticated;

-- =============================================================================
-- SUMMARY
-- =============================================================================

-- =============================================================================
-- UPDATE POOL VERSIONS
-- Set correct pool version for each question type based on display_name prefix
-- =============================================================================
UPDATE public.questions SET pool_version = '2022-2026' WHERE display_name LIKE 'T%';
UPDATE public.questions SET pool_version = '2023-2027' WHERE display_name LIKE 'G%';
UPDATE public.questions SET pool_version = '2024-2028' WHERE display_name LIKE 'E%';

ANALYZE;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Preview Branch Seeded Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test User: Sign up in the app to create an account';
  RAISE NOTICE '';
  RAISE NOTICE 'Questions: % (35+ per license type)', (SELECT COUNT(*) FROM public.questions);
  RAISE NOTICE '  - Technician: %', (SELECT COUNT(*) FROM public.questions WHERE display_name LIKE 'T%');
  RAISE NOTICE '  - General: %', (SELECT COUNT(*) FROM public.questions WHERE display_name LIKE 'G%');
  RAISE NOTICE '  - Extra: %', (SELECT COUNT(*) FROM public.questions WHERE display_name LIKE 'E%');
  RAISE NOTICE 'Glossary Terms: %', (SELECT COUNT(*) FROM public.glossary_terms);
  RAISE NOTICE 'Exam Sessions: %', (SELECT COUNT(*) FROM public.exam_sessions);
  RAISE NOTICE 'Topics: %', (SELECT COUNT(*) FROM public.topics);
  RAISE NOTICE 'Topic-Question Links: %', (SELECT COUNT(*) FROM public.topic_questions);
  RAISE NOTICE 'Lessons: %', (SELECT COUNT(*) FROM public.lessons);
  RAISE NOTICE 'Lesson-Topic Links: %', (SELECT COUNT(*) FROM public.lesson_topics);
  RAISE NOTICE 'ARRL Chapters: %', (SELECT COUNT(*) FROM public.arrl_chapters);
  RAISE NOTICE 'Questions with Chapter Links: %', (SELECT COUNT(*) FROM public.questions WHERE arrl_chapter_id IS NOT NULL);
  RAISE NOTICE 'Syllabus Subelements: %', (SELECT COUNT(*) FROM public.syllabus WHERE type = 'subelement');
  RAISE NOTICE 'Readiness Config: %', (SELECT COUNT(*) FROM public.readiness_config);
  RAISE NOTICE 'Ham Radio Tool Categories: %', (SELECT COUNT(*) FROM public.ham_radio_tool_categories);
  RAISE NOTICE 'Ham Radio Tools: %', (SELECT COUNT(*) FROM public.ham_radio_tools);
  RAISE NOTICE 'Alert Rules: %', (SELECT COUNT(*) FROM public.alert_rules);
  RAISE NOTICE 'Alerts: %', (SELECT COUNT(*) FROM public.alerts);
  RAISE NOTICE '  - Pending: %', (SELECT COUNT(*) FROM public.alerts WHERE status = 'pending');
  RAISE NOTICE '  - Acknowledged: %', (SELECT COUNT(*) FROM public.alerts WHERE status = 'acknowledged');
  RAISE NOTICE '  - Resolved: %', (SELECT COUNT(*) FROM public.alerts WHERE status = 'resolved');
  RAISE NOTICE 'Monitor Runs: %', (SELECT COUNT(*) FROM public.system_monitor_runs);
  RAISE NOTICE '';
  RAISE NOTICE 'Daily Streaks: Seed after signup with:';
  RAISE NOTICE '  SELECT seed_streak_data_for_user(''your-user-id'');';
  RAISE NOTICE '  SELECT seed_streak_at_risk_for_user(''your-user-id'');';
  RAISE NOTICE '  SELECT seed_no_streak_for_user(''your-user-id'');';
  RAISE NOTICE '========================================';
END $$;
