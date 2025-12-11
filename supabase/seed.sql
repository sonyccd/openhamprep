-- Seed file for Supabase preview branches and local development
-- Automatically runs on preview branches and `supabase db reset`
-- Provides enough data to test all app features

-- =============================================================================
-- TEST USER (for preview branch testing)
--
-- After deployment, call the seed-test-user Edge Function to create the test user:
--   curl -X POST https://<project-ref>.supabase.co/functions/v1/seed-test-user
--
-- Credentials:
--   Email: test@example.com
--   Password: testuser123
--
-- NOTE: Direct SQL inserts into auth.users are not supported by Supabase.
--       The Edge Function uses the Admin API instead.
-- =============================================================================

-- =============================================================================
-- QUESTIONS (35+ per license type for full practice tests)
-- =============================================================================

INSERT INTO public.questions (id, question, options, correct_answer, subelement, question_group) VALUES
  -- =========================================================================
  -- TECHNICIAN QUESTIONS (T prefix) - 40 questions
  -- =========================================================================

  -- T1 - FCC Rules
  ('T1A01', 'Which of the following is part of the Basis and Purpose of the Amateur Radio Service?',
   '["Providing personal radio communications for as many citizens as possible", "Providing communications for international non-profit organizations", "Advancing skills in the technical and communication phases of the radio art", "All of these choices are correct"]'::jsonb,
   2, 'T1', 'T1A'),

  ('T1A02', 'Which agency regulates and enforces the rules for the Amateur Radio Service in the United States?',
   '["FEMA", "The ITU", "The FCC", "Homeland Security"]'::jsonb,
   2, 'T1', 'T1A'),

  ('T1A03', 'What do the FCC rules state regarding the use of a phonetic alphabet for station identification in the Amateur Radio Service?',
   '["It is required when identifying your station", "It is encouraged", "It is required when operating phone", "All of these choices are correct"]'::jsonb,
   1, 'T1', 'T1A'),

  ('T1A04', 'How many operator/primary station license grants may be held by any one person?',
   '["One", "No more than two", "One for each band on which the person plans to operate", "As many as the person can pay for"]'::jsonb,
   0, 'T1', 'T1A'),

  ('T1A05', 'What is proof of possession of an FCC-granted license when your license document is not in your possession at your station?',
   '["A photocopy of the license document", "Information from the FCC ULS database", "Information on a ULS license search website", "All of these choices are correct"]'::jsonb,
   3, 'T1', 'T1A'),

  ('T1B01', 'What is the ITU?',
   '["An international association of amateur radio operators", "The International Telecommunications Union", "An amateur radio emergency service", "The International Amateur Radio Union"]'::jsonb,
   1, 'T1', 'T1B'),

  ('T1B02', 'Why are the frequency assignments for some U.S. Territories different from those in the 50 U.S. States?',
   '["Some U.S. Territories are located in ITU regions other than ITU Region 2", "Frequency assignments are determined by local governments", "Frequency assignments are determined by local amateurs", "Local broadcast stations heave priority"]'::jsonb,
   0, 'T1', 'T1B'),

  ('T1B03', 'Which frequency is in the 6 meter amateur band?',
   '["49.00 MHz", "52.525 MHz", "28.50 MHz", "222.15 MHz"]'::jsonb,
   1, 'T1', 'T1B'),

  ('T1B04', 'Which amateur band includes 146.52 MHz?',
   '["6 meters", "20 meters", "70 centimeters", "2 meters"]'::jsonb,
   3, 'T1', 'T1B'),

  ('T1B05', 'How may amateurs use the 219 to 220 MHz segment of 1.25 meter band?',
   '["Fixed digital message forwarding systems only", "For any purpose, with no restrictions", "As a secondary service for repeaters", "As emergency communications only"]'::jsonb,
   0, 'T1', 'T1B'),

  ('T1C01', 'For which license classes are new licenses currently available from the FCC?',
   '["Novice, Technician, General, Amateur Extra", "Technician, Technician Plus, General, Amateur Extra", "Technician, General, Amateur Extra", "Novice, Technician Plus, General, Amateur Extra"]'::jsonb,
   2, 'T1', 'T1C'),

  ('T1C02', 'Who may select a desired call sign under the vanity call sign rules?',
   '["Any licensed amateur", "Only Extra Class amateurs", "Only licensed amateurs with a General or Amateur Extra Class license", "The FCC randomly selects vanity call signs"]'::jsonb,
   0, 'T1', 'T1C'),

  ('T1C03', 'What types of international communications are an FCC-licensed amateur radio station permitted to make?',
   '["Communications incidental to the purposes of the Amateur Radio Service and remarks of a personal character", "Communications incidental to conducting business or remarks of a personal nature", "Only communications incidental to contest exchanges; proper identification is optional", "Any communications that would be permitted by an international broadcast station"]'::jsonb,
   0, 'T1', 'T1C'),

  ('T1D01', 'With which countries are FCC-licensed amateur radio stations prohibited from exchanging communications?',
   '["Any country whose primary language is not English", "Any country whose government objects to such communications", "Any country that is not a member of the International Telecommunications Union", "Any country that is not a member of the United Nations"]'::jsonb,
   1, 'T1', 'T1D'),

  ('T1D02', 'Under which of the following circumstances may an amateur radio station make one-way transmissions?',
   '["Under no circumstances", "When transmitting code practice, information bulletins, or transmissions necessary to provide emergency communications", "At any time, as long as no music is transmitted", "At any time, as long as the transmissions are less than 15 minutes"]'::jsonb,
   1, 'T1', 'T1D'),

  -- T2 - Operating Procedures
  ('T2A01', 'What is a common repeater frequency offset in the 2 meter band?',
   '["Plus or minus 5 MHz", "Plus or minus 600 kHz", "Plus or minus 500 kHz", "Plus or minus 1 MHz"]'::jsonb,
   1, 'T2', 'T2A'),

  ('T2A02', 'What is the national calling frequency for FM simplex operations in the 2 meter band?',
   '["146.520 MHz", "145.000 MHz", "432.100 MHz", "446.000 MHz"]'::jsonb,
   0, 'T2', 'T2A'),

  ('T2A03', 'What is a common repeater frequency offset in the 70 cm band?',
   '["Plus or minus 5 MHz", "Plus or minus 600 kHz", "Plus or minus 500 kHz", "Plus or minus 1 MHz"]'::jsonb,
   0, 'T2', 'T2A'),

  ('T2A04', 'What is an appropriate way to call another station on a repeater if you know the other station''s call sign?',
   '["Say break, break, then say the station''s call sign", "Say the station''s call sign, then identify with your call sign", "Say CQ three times, then the other station''s call sign", "Wait for the other station to call CQ"]'::jsonb,
   1, 'T2', 'T2A'),

  ('T2A05', 'How should you respond to a station calling CQ?',
   '["Transmit CQ followed by the other station''s call sign", "Transmit your call sign followed by the other station''s call sign", "Transmit the other station''s call sign followed by your call sign", "Transmit a signal report followed by your call sign"]'::jsonb,
   2, 'T2', 'T2A'),

  ('T2B01', 'What is the term used to describe an amateur station that is transmitting and receiving on the same frequency?',
   '["Full duplex", "Diplex", "Simplex", "Multiplex"]'::jsonb,
   2, 'T2', 'T2B'),

  ('T2B02', 'What is the term used to describe the use of a sub-audible tone transmitted along with normal voice audio to open the squelch of a receiver?',
   '["Carrier squelch", "Tone burst", "DTMF", "CTCSS"]'::jsonb,
   3, 'T2', 'T2B'),

  ('T2B03', 'Which of the following describes a linked repeater network?',
   '["A network of repeaters where signals received by one are repeated by all", "A repeater with more than one receiver", "Multiple repeaters at one location", "A repeater with a backup power source"]'::jsonb,
   0, 'T2', 'T2B'),

  -- T3 - Radio Wave Propagation
  ('T3A01', 'Why do VHF signal ranges sometimes exceed their normal limits?',
   '["High pressure systems over 30 degrees north and south latitude", "A break in the E layer of the ionosphere", "Presence of a meteor trail", "All of these choices are correct"]'::jsonb,
   3, 'T3', 'T3A'),

  ('T3A02', 'What is the effect of tropospheric ducting on radio communications?',
   '["It allows VHF and UHF signals to travel much farther than normal", "It causes tropospheric propagation to become very short range", "It disrupts signals on the lower HF frequencies", "It affects frequencies above 300 GHz"]'::jsonb,
   0, 'T3', 'T3A'),

  ('T3A03', 'What antenna polarization is normally used for long-distance CW and SSB contacts on the VHF and UHF bands?',
   '["Right-hand circular", "Left-hand circular", "Horizontal", "Vertical"]'::jsonb,
   2, 'T3', 'T3A'),

  ('T3B01', 'What is the relationship between the electric and magnetic fields of an electromagnetic wave?',
   '["They are in parallel", "They are at right angles", "They revolve around each other", "They are independent of each other"]'::jsonb,
   1, 'T3', 'T3B'),

  ('T3B02', 'What property of a radio wave defines its polarization?',
   '["The orientation of the electric field", "The orientation of the magnetic field", "The ratio of the energy in the wave to its frequency", "The ratio of the velocity to wavelength"]'::jsonb,
   0, 'T3', 'T3B'),

  -- T4 - Amateur Radio Practices
  ('T4A01', 'Which of the following is an appropriate power supply rating for a typical 50 watt output mobile FM transceiver?',
   '["5 amperes at 12 volts", "12 amperes at 12 volts", "20 amperes at 6 volts", "5 amperes at 220 volts"]'::jsonb,
   1, 'T4', 'T4A'),

  ('T4A02', 'What is a function of the SSB/CW-Loss/FM switch on a VHF power amplifier?',
   '["To change the amplifier from Class A to Class C mode", "To change the amplifier output filter cutoff frequency", "To reduce gain for SSB operations", "To select the operating mode"]'::jsonb,
   3, 'T4', 'T4A'),

  ('T4B01', 'What is the effect of excessive microphone gain on SSB transmissions?',
   '["Clearer speech", "Improved signal-to-noise ratio", "Reduced transmitter output power", "Distorted and hard to understand speech"]'::jsonb,
   3, 'T4', 'T4B'),

  ('T4B02', 'Which of the following can be used to enter a transceiver frequency using a microphone?',
   '["Voice frequency recognition", "A DTMF keypad", "Carrier frequency pulses", "All of these choices are correct"]'::jsonb,
   1, 'T4', 'T4B'),

  -- T5 - Electrical Principles
  ('T5A01', 'Current is measured in which of the following units?',
   '["Volts", "Watts", "Ohms", "Amperes"]'::jsonb,
   3, 'T5', 'T5A'),

  ('T5A02', 'Electrical power is measured in which of the following units?',
   '["Volts", "Watts", "Ohms", "Amperes"]'::jsonb,
   1, 'T5', 'T5A'),

  ('T5A03', 'What is the name for the flow of electrons in an electric circuit?',
   '["Voltage", "Resistance", "Capacitance", "Current"]'::jsonb,
   3, 'T5', 'T5A'),

  ('T5B01', 'How many milliamperes is 1.5 amperes?',
   '["15 milliamperes", "150 milliamperes", "1500 milliamperes", "15000 milliamperes"]'::jsonb,
   2, 'T5', 'T5B'),

  ('T5B02', 'Which of the following units is used to measure electrical power?',
   '["Volt", "Watt", "Ohm", "Ampere"]'::jsonb,
   1, 'T5', 'T5B'),

  ('T5C01', 'What is the ability to store energy in an electric field called?',
   '["Inductance", "Resistance", "Tolerance", "Capacitance"]'::jsonb,
   3, 'T5', 'T5C'),

  ('T5C02', 'What is the unit of capacitance?',
   '["The farad", "The ohm", "The volt", "The henry"]'::jsonb,
   0, 'T5', 'T5C'),

  -- =========================================================================
  -- GENERAL QUESTIONS (G prefix) - 40 questions
  -- =========================================================================

  ('G1A01', 'On which HF bands does a General Class license holder have phone privileges?',
   '["None", "60, 20, 17, and 12 meter bands only", "160, 60, 40, 20, 17, 15, 12, and 10 meter bands", "10 and 15 meter bands only"]'::jsonb,
   2, 'G1', 'G1A'),

  ('G1A02', 'On which of the following bands is phone operation prohibited?',
   '["160 meters", "30 meters", "17 meters", "12 meters"]'::jsonb,
   1, 'G1', 'G1A'),

  ('G1A03', 'On which of the following band segments may you operate if you are a General Class licensee?',
   '["Only on the band segments authorized for Technician Class licensees", "On any band segment authorized for Amateur Extra Class licensees", "On any amateur frequency authorized for General Class or higher licenses", "Depends on the mode of transmission"]'::jsonb,
   2, 'G1', 'G1A'),

  ('G1A04', 'Which of the following frequencies is within the General Class portion of the 75 meter phone band segment?',
   '["3900 kHz", "3575 kHz", "3825 kHz", "3950 kHz"]'::jsonb,
   2, 'G1', 'G1A'),

  ('G1A05', 'Which of the following frequencies is within the General Class portion of the 20 meter phone band?',
   '["14005 kHz", "14100 kHz", "14350 kHz", "14399 kHz"]'::jsonb,
   2, 'G1', 'G1A'),

  ('G1B01', 'What is the maximum height above ground to which an antenna structure may be erected without requiring notification to the FAA?',
   '["50 feet", "100 feet", "200 feet", "300 feet"]'::jsonb,
   2, 'G1', 'G1B'),

  ('G1B02', 'What is one way to revalidate a club station call sign?',
   '["File a new club station application", "Add a new trustee", "Both of these choices are correct", "Neither of these choices is correct"]'::jsonb,
   2, 'G1', 'G1B'),

  ('G2A01', 'What mode is most commonly used for voice communications on the 160, 75, and 40 meter bands?',
   '["Upper sideband", "Lower sideband", "Vestigial sideband", "Double sideband"]'::jsonb,
   1, 'G2', 'G2A'),

  ('G2A02', 'What mode is most commonly used for voice communications on the 17 and 15 meter bands?',
   '["Upper sideband", "Lower sideband", "Vestigial sideband", "Double sideband"]'::jsonb,
   0, 'G2', 'G2A'),

  ('G2A03', 'What do the terms "__(call sign)__ from __(location)__" and "__(call sign)__ portable __(location)__" mean?',
   '["The operator is moving between two locations", "The operator is operating remote controlled", "It is a slant indicator for mobile or portable operation", "The operator is working from a specific location away from their normal station"]'::jsonb,
   3, 'G2', 'G2A'),

  ('G2B01', 'What is the purpose of a band plan?',
   '["To plan for orderly and efficient use of the band", "To set power limits for various modes", "To determine which modes may be used on specific frequencies", "All of these choices are correct"]'::jsonb,
   3, 'G2', 'G2B'),

  ('G2B02', 'What is the first thing you should do if you are in QSO when an emergency station requests help?',
   '["Ask the calling station if you may help", "Inform your QSO partner that you must stop the QSO", "Stop transmitting and stay on frequency to monitor for further calls from the station", "All of these choices are correct"]'::jsonb,
   3, 'G2', 'G2B'),

  ('G3A01', 'Approximately how long is the typical 11-year sunspot cycle?',
   '["8 years", "11 years", "14 years", "22 years"]'::jsonb,
   1, 'G3', 'G3A'),

  ('G3A02', 'What effect does a solar flare have on the daytime ionospheric propagation of HF radio waves?',
   '["No significant effect", "A brief improvement in propagation", "Disruption of HF propagation due to increased ionospheric absorption", "A major increase in the maximum usable frequency"]'::jsonb,
   2, 'G3', 'G3A'),

  ('G3A03', 'What is the solar flux index?',
   '["A measure of solar activity that correlates with HF propagation conditions", "A measure of the sun''s temperature", "A measure of ultraviolet radiation from the sun", "A measure of the solar wind"]'::jsonb,
   0, 'G3', 'G3A'),

  ('G3B01', 'What is skip zone?',
   '["The area covered by ground wave propagation", "An area where signals from distant stations can be heard but not from local stations", "The distance a radio wave must travel before reaching the ionosphere", "An area which is too far for ground wave propagation but too close for skip propagation"]'::jsonb,
   3, 'G3', 'G3B'),

  ('G3B02', 'What is an advantage of NVIS?',
   '["Low-angle radiation for working DX", "Fills in the skip zone", "Reduced signal fading", "Improved signal to noise ratio"]'::jsonb,
   1, 'G3', 'G3B'),

  ('G4A01', 'What is one reason a power amplifier might fail to achieve full power output?',
   '["Insufficient drive power", "Low SWR", "Excessive drive power", "All of these choices are correct"]'::jsonb,
   0, 'G4', 'G4A'),

  ('G4A02', 'What is the purpose of an antenna tuner?',
   '["To match impedances", "To increase transmitter power", "To reduce receiver noise", "To improve antenna gain"]'::jsonb,
   0, 'G4', 'G4A'),

  ('G4B01', 'What item of test equipment contains horizontal and vertical channel amplifiers?',
   '["An ohmmeter", "A signal generator", "An ammeter", "An oscilloscope"]'::jsonb,
   3, 'G4', 'G4B'),

  ('G4B02', 'Which of the following is a use for an antenna analyzer?',
   '["Measuring the SWR of an antenna system", "Determining if an amplifier is operating properly", "Measuring the gain of a directional antenna", "Determining the front-to-back ratio of an antenna"]'::jsonb,
   0, 'G4', 'G4B'),

  ('G5A01', 'What happens when the weights of reactance and resistance in a series circuit are equal?',
   '["The circuit has maximum resistance", "The circuit has minimum resistance", "The circuit is resonant", "The circuit has maximum impedance"]'::jsonb,
   2, 'G5', 'G5A'),

  ('G5A02', 'What is the unit of admittance?',
   '["Ohms", "Watts", "Siemens", "Farads"]'::jsonb,
   2, 'G5', 'G5A'),

  ('G5B01', 'What is the equation for calculating power in a DC circuit?',
   '["P = E / R", "P = E x I", "P = I / E", "P = R x I"]'::jsonb,
   1, 'G5', 'G5B'),

  ('G5B02', 'How does a resistor''s value change with temperature?',
   '["Decreases as temperature increases", "Increases as temperature increases", "Stays the same regardless of temperature", "Varies in unpredictable ways"]'::jsonb,
   1, 'G5', 'G5B'),

  ('G6A01', 'What is the effect of a capacitor on a DC circuit?',
   '["Allows DC to pass through", "Blocks DC", "Increases DC voltage", "Reduces DC current"]'::jsonb,
   1, 'G6', 'G6A'),

  ('G6A02', 'What is the effect of an inductor on an AC circuit?',
   '["Allows all frequencies to pass equally", "Passes low frequencies better than high frequencies", "Passes high frequencies better than low frequencies", "Blocks all frequencies equally"]'::jsonb,
   1, 'G6', 'G6A'),

  ('G7A01', 'What is the function of a power supply filter capacitor?',
   '["To increase voltage output", "To reduce ripple voltage", "To increase current output", "To reduce voltage output"]'::jsonb,
   1, 'G7', 'G7A'),

  ('G7A02', 'What happens to the DC voltage output of a power supply when the load current increases?',
   '["It increases", "It decreases", "It stays the same", "It oscillates"]'::jsonb,
   1, 'G7', 'G7A'),

  ('G8A01', 'What is the advantage of SSB over FM for voice transmissions?',
   '["Better audio quality", "Less bandwidth used", "Higher audio frequencies transmitted", "Lower signal strength required"]'::jsonb,
   1, 'G8', 'G8A'),

  ('G8A02', 'What is the approximate bandwidth of a typical SSB voice signal?',
   '["1 kHz", "3 kHz", "6 kHz", "15 kHz"]'::jsonb,
   1, 'G8', 'G8A'),

  ('G9A01', 'What is the characteristic impedance of coaxial cable?',
   '["The DC resistance of the cable", "The AC resistance that would transfer maximum power from source to load", "The variable resistance that changes with temperature", "The resistance measured when the cable is coiled"]'::jsonb,
   1, 'G9', 'G9A'),

  ('G9A02', 'What is a disadvantage of using too long a transmission line?',
   '["Increased power loss", "Decreased standing wave ratio", "Increased antenna gain", "Decreased bandwidth"]'::jsonb,
   0, 'G9', 'G9A'),

  ('G0A01', 'What is one way to mitigate the risk of RF exposure to people?',
   '["Increase transmitter power", "Lower antenna height", "Increase distance from the antenna", "Use FM instead of SSB"]'::jsonb,
   2, 'G0', 'G0A'),

  ('G0A02', 'When evaluating RF exposure levels from your station, what should be considered?',
   '["Duty cycle of the transmitter", "Frequency and power level", "Distance from antenna", "All of these choices are correct"]'::jsonb,
   3, 'G0', 'G0A'),

  -- =========================================================================
  -- EXTRA QUESTIONS (E prefix) - 40 questions
  -- =========================================================================

  ('E1A01', 'When using a transceiver that displays the carrier frequency of phone signals, which of the following displayed frequencies represents the highest frequency at which a properly adjusted USB emission will be totally within the band?',
   '["The exact upper band edge", "300 Hz below the upper band edge", "1 kHz below the upper band edge", "3 kHz below the upper band edge"]'::jsonb,
   3, 'E1', 'E1A'),

  ('E1A02', 'When using a transceiver that displays the carrier frequency of phone signals, which of the following displayed frequencies represents the lowest frequency at which a properly adjusted LSB emission will be totally within the band?',
   '["The exact lower band edge", "300 Hz above the lower band edge", "1 kHz above the lower band edge", "3 kHz above the lower band edge"]'::jsonb,
   3, 'E1', 'E1A'),

  ('E1A03', 'What is the maximum legal carrier frequency on 60 meters for USB RTTY emissions?',
   '["5330.5 kHz", "5346.5 kHz", "5366.5 kHz", "5371.5 kHz"]'::jsonb,
   2, 'E1', 'E1A'),

  ('E1A04', 'With your transceiver displaying carrier frequency, what is the maximum legal frequency on 60 meters for USB phone emissions?',
   '["5330.5 kHz", "5346.5 kHz", "5366.5 kHz", "5371.5 kHz"]'::jsonb,
   2, 'E1', 'E1A'),

  ('E1A05', 'What is the maximum power output permitted on the 60 meter band?',
   '["100 watts PEP", "200 watts PEP", "50 watts PEP", "10 watts PEP"]'::jsonb,
   0, 'E1', 'E1A'),

  ('E1B01', 'What is the maximum permitted transmitter peak envelope power for an amateur station operating in the satellite sub-bands?',
   '["250 watts", "500 watts", "1000 watts", "1500 watts"]'::jsonb,
   0, 'E1', 'E1B'),

  ('E1B02', 'What is the amateur satellite service?',
   '["A service using amateur stations on Earth satellites for specific purposes", "A service using stations on Earth satellites for communication with other countries", "A service using stations on Earth satellites for commercial purposes", "A service using amateur stations to provide information to satellites"]'::jsonb,
   0, 'E1', 'E1B'),

  ('E2A01', 'How are radio communications between amateur stations and international space stations governed?',
   '["By United Nations treaty", "By agreements between the countries involved", "By rules of the International Telecommunication Union", "By rules of the International Amateur Radio Union"]'::jsonb,
   1, 'E2', 'E2A'),

  ('E2A02', 'What minimum information must be transmitted on a spread spectrum transmission?',
   '["The station call sign", "The ITU Region where the station is located", "The frequency of the transmission", "The date and time of transmission"]'::jsonb,
   0, 'E2', 'E2A'),

  ('E2A03', 'What is the meaning of the term "critical frequency" in reference to propagation?',
   '["The frequency below which a radio wave will not be refracted by the ionosphere", "The highest frequency that will be refracted back to Earth", "The frequency that will refract through the ionosphere with maximum efficiency", "The lowest frequency that will refract back to Earth"]'::jsonb,
   1, 'E2', 'E2A'),

  ('E3A01', 'What is the approximate lower frequency limit for EME communications?',
   '["14 MHz", "50 MHz", "144 MHz", "432 MHz"]'::jsonb,
   1, 'E3', 'E3A'),

  ('E3A02', 'What characterizes EME communications?',
   '["Very high path loss and low data rates", "Long delays and signal distortion", "Both of these choices are correct", "Neither of these choices is correct"]'::jsonb,
   2, 'E3', 'E3A'),

  ('E3A03', 'What is the typical path loss of a 2 meter EME signal?',
   '["100 dB", "150 dB", "252 dB", "350 dB"]'::jsonb,
   2, 'E3', 'E3A'),

  ('E4A01', 'Which of the following test instruments would be best for measuring the SWR of a beam antenna?',
   '["A spectrum analyzer", "A digital voltmeter", "A directional wattmeter", "An ohmmeter"]'::jsonb,
   2, 'E4', 'E4A'),

  ('E4A02', 'Which of the following would be the best instrument for measuring a filter''s frequency response?',
   '["An oscilloscope", "A vector network analyzer", "A function generator", "A logic analyzer"]'::jsonb,
   1, 'E4', 'E4A'),

  ('E4A03', 'What noise source is generally most significant when analyzing receiver performance?',
   '["Thermal noise", "Shot noise", "Flicker noise", "All of these equally"]'::jsonb,
   0, 'E4', 'E4A'),

  ('E5A01', 'What is the phase relationship between reactance and resistance in a series circuit?',
   '["They are in phase", "They are 90 degrees out of phase", "They are 180 degrees out of phase", "They are 45 degrees out of phase"]'::jsonb,
   1, 'E5', 'E5A'),

  ('E5A02', 'What is resonance in an electrical circuit?',
   '["The condition where inductive and capacitive reactances are equal", "The condition where resistance equals reactance", "The condition where impedance is maximum", "The condition where current is minimum"]'::jsonb,
   0, 'E5', 'E5A'),

  ('E5A03', 'What is the Q of a parallel RLC circuit?',
   '["Resistance divided by reactance", "Reactance divided by resistance", "The ratio of capacitive to inductive reactance", "The square root of resistance times reactance"]'::jsonb,
   1, 'E5', 'E5A'),

  ('E5B01', 'What is the result of skin effect?',
   '["RF current flows near the surface of a conductor", "DC current flows near the center of a conductor", "AC voltage appears across an open circuit", "RF voltage appears across a short circuit"]'::jsonb,
   0, 'E5', 'E5B'),

  ('E5B02', 'What causes the skin effect?',
   '["The magnetic field surrounding the conductor", "The electric field surrounding the conductor", "Eddy currents in the conductor", "All of these choices are correct"]'::jsonb,
   3, 'E5', 'E5B'),

  ('E6A01', 'What is the function of a three-terminal regulator IC?',
   '["To increase voltage", "To provide constant voltage", "To convert AC to DC", "To amplify signals"]'::jsonb,
   1, 'E6', 'E6A'),

  ('E6A02', 'What is the maximum operating frequency of a typical 741 op-amp?',
   '["1 MHz", "10 MHz", "100 MHz", "1 GHz"]'::jsonb,
   0, 'E6', 'E6A'),

  ('E6A03', 'What is the primary advantage of a MOSFET over a bipolar transistor?',
   '["Higher gain", "Higher input impedance", "Higher power handling", "Lower noise"]'::jsonb,
   1, 'E6', 'E6A'),

  ('E7A01', 'What is an advantage of a Class D amplifier?',
   '["Higher fidelity", "Higher efficiency", "Lower noise", "Wider bandwidth"]'::jsonb,
   1, 'E7', 'E7A'),

  ('E7A02', 'What type of bias is used in a Class AB amplifier?',
   '["Forward bias only", "Reverse bias only", "Slight forward bias", "No bias"]'::jsonb,
   2, 'E7', 'E7A'),

  ('E7A03', 'What is the purpose of neutralization in a vacuum tube amplifier?',
   '["To increase gain", "To cancel feedback and prevent oscillation", "To improve frequency response", "To reduce noise"]'::jsonb,
   1, 'E7', 'E7A'),

  ('E8A01', 'What is the term for the number of times an ac signal reaches maximum value in one second?',
   '["Bandwidth", "Cycle rate", "Frequency", "Pulse rate"]'::jsonb,
   2, 'E8', 'E8A'),

  ('E8A02', 'What is the bandwidth of a properly adjusted 170 Hz shift FSK RTTY signal?',
   '["170 Hz", "250 Hz", "500 Hz", "1 kHz"]'::jsonb,
   1, 'E8', 'E8A'),

  ('E8A03', 'What is the typical bandwidth of a PSK31 signal?',
   '["31 Hz", "62.5 Hz", "150 Hz", "300 Hz"]'::jsonb,
   0, 'E8', 'E8A'),

  ('E9A01', 'What is antenna bandwidth?',
   '["Antenna length divided by number of elements", "The frequency range over which an antenna satisfies a performance requirement", "The angle between the half-power points on an antenna pattern", "The frequency spread between two antennas of different designs"]'::jsonb,
   1, 'E9', 'E9A'),

  ('E9A02', 'What is the approximate radiation resistance of a quarter-wave vertical antenna?',
   '["12 ohms", "36 ohms", "72 ohms", "144 ohms"]'::jsonb,
   1, 'E9', 'E9A'),

  ('E9A03', 'What is the advantage of using a trap antenna?',
   '["It can operate on multiple bands", "It has higher gain", "It is more directional", "It has wider bandwidth"]'::jsonb,
   0, 'E9', 'E9A'),

  ('E0A01', 'What is the most likely cause of RF burns?',
   '["High SWR", "Excessive RF current through a conductor in contact with the skin", "RF feedback", "High power output"]'::jsonb,
   1, 'E0', 'E0A'),

  ('E0A02', 'What is the purpose of the safety interlocks installed in high voltage power supplies?',
   '["To reduce interference to other equipment", "To prevent dangerous shock hazards", "To improve power supply regulation", "To increase efficiency"]'::jsonb,
   1, 'E0', 'E0A'),

  ('E0A03', 'What is the minimum safe distance from a power line to an antenna?',
   '["Equal to the height of the power line", "Enough that the antenna cannot contact the power line if it falls", "Half the height of the power line", "There is no minimum distance if the antenna is properly insulated"]'::jsonb,
   1, 'E0', 'E0A')

ON CONFLICT (id) DO NOTHING;

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
-- SUMMARY
-- =============================================================================

ANALYZE;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Preview Branch Seeded Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test User: Call seed-test-user Edge Function first!';
  RAISE NOTICE '';
  RAISE NOTICE 'Questions: % (35+ per license type)', (SELECT COUNT(*) FROM public.questions);
  RAISE NOTICE '  - Technician: %', (SELECT COUNT(*) FROM public.questions WHERE id LIKE 'T%');
  RAISE NOTICE '  - General: %', (SELECT COUNT(*) FROM public.questions WHERE id LIKE 'G%');
  RAISE NOTICE '  - Extra: %', (SELECT COUNT(*) FROM public.questions WHERE id LIKE 'E%');
  RAISE NOTICE 'Glossary Terms: %', (SELECT COUNT(*) FROM public.glossary_terms);
  RAISE NOTICE 'Exam Sessions: %', (SELECT COUNT(*) FROM public.exam_sessions);
  RAISE NOTICE '========================================';
END $$;
