const app = document.getElementById('app');
const logo = '/assets/jagd-logo.png';
let currentPrint = '';
let pirMixCount = 1;
const signatureStore = {};

const PROJECT_OPTIONS = [
  '',
  '69th St. Transfer Bridge',
  'BA-2024-RE-102-CM Mid-Hudson Bridge',
  'BRX9579 - Boston Road Bridge',
  'BW96 & VN12 - Whitestone Hellman Platforms',
  'C35311 - Dyre Ave. Line',
  'D214898 - TANE22-29 Restani T&M',
  'D264324 - Westchester County Field Metalizing',
  'D264965 - Highway bridge repair W&W',
  'D265046 - Highway bridge repair W&W',
  'D265307 - WO03',
  'D265343 - Bove W&W 2',
  'Devon Bridge',
  'DMB-25-01',
  'FCC 2056',
  'Gold Star Memorial Bridge',
  'Governors Island',
  'Grand Concourse',
  'GW 244.289 Lemoine Ave',
  'GWB Cables',
  'HB1070MD - Macombs Dam Bridge',
  'HBKBQE - NYCDOT Bove',
  'K7279 & K6176 Gordie Howe',
  'Park Avenue',
  'Pulaski 8B',
  'QBB-2017',
  'RK19A',
  'RK90',
  'Sandy Relief',
  'VN81X',
  'VN-84B - Verrazzano Bridge Ramps Brooklyn',
  'Warehouse',
  'Other'
];
const DAILY_EQUIPMENT_URL = 'https://jagdconstruction.github.io/daily_equipment_inspection/';
let activeWorkers = [];
const EMBEDDED_ACTIVE_WORKERS = [{"firstName":"Adderlyn","lastName":"Reyes","fullName":"Adderlyn Reyes","class":"Journeyman","local":"806.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Alberto","lastName":"Duron Hernandez","fullName":"Alberto Duron Hernandez","class":"Journeyman","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Albin","lastName":"Reyes","fullName":"Albin Reyes","class":"Journeyman","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Alex","lastName":"Huezo","fullName":"Alex Huezo","class":"Apprentice 1st","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Alex","lastName":"Miketon Miranda","fullName":"Alex Miketon Miranda","class":"Journeyman","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Alfredo","lastName":"Manno","fullName":"Alfredo Manno","class":"Journeyman","local":"361.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Iron Worker","crew":"Bridge Painting"},{"firstName":"Alison","lastName":"Dos Santos","fullName":"Alison Dos Santos","class":"Journeyman","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Amaury","lastName":"Calhau","fullName":"Amaury Calhau","class":"Journeyman","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Anderson","lastName":"Ceranto","fullName":"Anderson Ceranto","class":"Journeyman","local":"806.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Angelino","lastName":"Antunes","fullName":"Angelino Antunes","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Anthony","lastName":"Lovich","fullName":"Anthony Lovich","class":"Journeyman","local":"806.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"anthony","lastName":"test","fullName":"anthony test","class":"Journeyman","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Anthymos","lastName":"Mytikas","fullName":"Anthymos Mytikas","class":"Journeyman","local":"806.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Antonio","lastName":"Sluzala","fullName":"Antonio Sluzala","class":"Journeyman","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Apostolos","lastName":"Dovas","fullName":"Apostolos Dovas","class":"","local":"","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Beau","lastName":"Forget","fullName":"Beau Forget","class":"Journeyman","local":"806.0","currentJob":"D265343 Bove W&W2","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Brandon","lastName":"Pratt","fullName":"Brandon Pratt","class":"Journeyman","local":"2353.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Brent","lastName":"Novak","fullName":"Brent Novak","class":"Journeyman","local":"2353.0","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Bryant","lastName":"Urbina","fullName":"Bryant Urbina","class":"Apprentice 3rd","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Carlos","lastName":"Canales","fullName":"Carlos Canales","class":"Journeyman","local":"476.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Carlos","lastName":"Lopez Rodriguez","fullName":"Carlos Lopez Rodriguez","class":"Journeyman","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Christopher","lastName":"Calderon","fullName":"Christopher Calderon","class":"Apprentice 2nd","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Christopher","lastName":"Stephans","fullName":"Christopher Stephans","class":"Journeyman","local":"2353.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Cliver","lastName":"Pereira","fullName":"Cliver Pereira","class":"Journeyman","local":"806.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Craig","lastName":"Harper","fullName":"Craig Harper","class":"Journeyman","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Daniel","lastName":"Ribeiro","fullName":"Daniel Ribeiro","class":"Journeyman","local":"1331.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Daniel","lastName":"Stucky","fullName":"Daniel Stucky","class":"Journeyman","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Devyd","lastName":"De Oliveira","fullName":"Devyd De Oliveira","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Dicesar","lastName":"Miranda","fullName":"Dicesar Miranda","class":"Journeyman","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Dimitri","lastName":"Pizanias","fullName":"Dimitri Pizanias","class":"Journeyman","local":"806.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Dimitrios","lastName":"Billiris","fullName":"Dimitrios Billiris","class":"Journeyman","local":"476.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Dylan","lastName":"Alexander","fullName":"Dylan Alexander","class":"Journeyman","local":"2353.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Edwin","lastName":"Oliva","fullName":"Edwin Oliva","class":"Journeyman","local":"1.0","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Eladio","lastName":"Reyes Mendoza","fullName":"Eladio Reyes Mendoza","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Elber","lastName":"Cruz Flores","fullName":"Elber Cruz Flores","class":"Journeyman","local":"1331.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Elcio","lastName":"Antoneli","fullName":"Elcio Antoneli","class":"Journeyman","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Elias","lastName":"Douropoulos","fullName":"Elias Douropoulos","class":"Journeyman","local":"476.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Elvin","lastName":"Chirinos Piedy","fullName":"Elvin Chirinos Piedy","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Emanuel","lastName":"Tiliakos","fullName":"Emanuel Tiliakos","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Emerson","lastName":"Heil","fullName":"Emerson Heil","class":"Journeyman","local":"806.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Estefano","lastName":"Hornung","fullName":"Estefano Hornung","class":"Journeyman","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Eugene","lastName":"Wegner","fullName":"Eugene Wegner","class":"Journeyman","local":"2353.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Ever","lastName":"Argueta Mendoza","fullName":"Ever Argueta Mendoza","class":"Journeyman","local":"1331.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Ever","lastName":"Mendoza Argueta","fullName":"Ever Mendoza Argueta","class":"Journeyman","local":"1331.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Fabiano","lastName":"Rodrigues","fullName":"Fabiano  Rodrigues","class":"Journeyman","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Felix","lastName":"Diaz","fullName":"Felix Diaz","class":"Apprentice 1st","local":"806.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Felix","lastName":"Lopez Gonzalez","fullName":"Felix Lopez Gonzalez","class":"Apprentice 1st","local":"806.0","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Fernando","lastName":"Silverio","fullName":"Fernando Silverio","class":"Journeyman","local":"476.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Francisco","lastName":"Martinez","fullName":"Francisco Martinez","class":"","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Francisco","lastName":"Medina","fullName":"Francisco Medina","class":"Journeyman","local":"2353.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Frehyli","lastName":"Calbral De Jesus","fullName":"Frehyli Calbral De Jesus","class":"Apprentice 1st","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Geanderson","lastName":"Campos","fullName":"Geanderson Campos","class":"Apprentice 2nd","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"George","lastName":"Grillis","fullName":"George Grillis","class":"Journeyman","local":"476.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"George K","lastName":"Lyras","fullName":"George K Lyras","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"George","lastName":"Test","fullName":"George Test","class":"Journeyman","local":"155.0","currentJob":"VN Ramps","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"George","lastName":"Test","fullName":"George Test","class":"Journeyman","local":"155.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Gregory","lastName":"Coulter","fullName":"Gregory Coulter","class":"Apprentice 3rd","local":"2353.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Gregory","lastName":"Harper","fullName":"Gregory Harper","class":"Journeyman","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Guillermo","lastName":"Sahagun","fullName":"Guillermo Sahagun","class":"","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Gustavo","lastName":"Pereira","fullName":"Gustavo Pereira","class":"Journeyman","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Helen","lastName":"Betances","fullName":"Helen Betances","class":"Journeyman","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Henry","lastName":"Melara","fullName":"Henry Melara","class":"Apprentice 2nd","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Hugo","lastName":"Diaz Rodas","fullName":"Hugo Diaz Rodas","class":"Journeyman","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Hugo","lastName":"Rodas","fullName":"Hugo Rodas","class":"Journeyman","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"INACTIVE","lastName":"INACTIVE","fullName":"INACTIVE","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Ioannis","lastName":"Mytikas","fullName":"Ioannis Mytikas","class":"Journeyman","local":"806.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Ismael","lastName":"Brandino","fullName":"Ismael Brandino","class":"Journeyman","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Ismael","lastName":"Martinez","fullName":"Ismael Martinez","class":"Journeyman","local":"476.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Israel","lastName":"Vieira","fullName":"Israel Vieira","class":"Journeyman","local":"806.0","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Jahcinto","lastName":"Estrela","fullName":"Jahcinto Estrela","class":"Journeyman","local":"806.0","currentJob":"VN Ramps","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Jared","lastName":"Arista Martinez","fullName":"Jared Arista Martinez","class":"Apprentice 1st","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Jefferson","lastName":"Domaleski","fullName":"Jefferson Domaleski","class":"Journeyman","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Jerry","lastName":"Seaborn","fullName":"Jerry Seaborn","class":"Journeyman","local":"2353.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Joao Victor","lastName":"Hornung","fullName":"Joao Victor Hornung","class":"Apprentice 1st","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Joel","lastName":"Monterroso","fullName":"Joel Monterroso","class":"Journeyman","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"John","lastName":"Manglis","fullName":"John Manglis","class":"","local":"","currentJob":"BRC231F/Queensboro Bridge","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Jonmartin","lastName":"Hernandez","fullName":"Jonmartin Hernandez","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Jorge","lastName":"Alvarez","fullName":"Jorge Alvarez","class":"Journeyman","local":"1.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Jorge","lastName":"Santiago","fullName":"Jorge Santiago","class":"Journeyman","local":"806.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Jose","lastName":"Gomez","fullName":"Jose Gomez","class":"Journeyman","local":"1.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Jose","lastName":"Lineio","fullName":"Jose Lineio","class":"Journeyman","local":"806.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Jose","lastName":"Lineiro","fullName":"Jose Lineiro","class":"Journeyman","local":"806.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Joseph","lastName":"Squires","fullName":"Joseph Squires","class":"Journeyman","local":"361.0","currentJob":"","status":"Active","employeeId":"","trade":"Iron Worker","crew":""},{"firstName":"Joseph","lastName":"Tewes","fullName":"Joseph Tewes","class":"Journeyman","local":"2011.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Joshua","lastName":"Williams","fullName":"Joshua Williams","class":"Journeyman","local":"40.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Iron Worker","crew":"Bridge Painting"},{"firstName":"Juan","lastName":"Aguilar","fullName":"Juan Aguilar","class":"Journeyman","local":"476.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Juan","lastName":"Aguilar Villeda","fullName":"Juan Aguilar Villeda","class":"Journeyman","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Juan","lastName":"Castellanos","fullName":"Juan Castellanos","class":"Journeyman","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Juan","lastName":"Ortega","fullName":"Juan Ortega","class":"Journeyman","local":"1331.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Kevin","lastName":"Canales Torres","fullName":"Kevin Canales Torres","class":"Journeyman","local":"476.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Kinn","lastName":"Estrela","fullName":"Kinn Estrela","class":"Journeyman","local":"806.0","currentJob":"VN Ramps","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Kyle","lastName":"Rowsey","fullName":"Kyle Rowsey","class":"Journeyman","local":"2353.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Lorenzo","lastName":"Rodriguez Pena","fullName":"Lorenzo Rodriguez Pena","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Luis","lastName":"Tzapin Ajiataz","fullName":"Luis Tzapin Ajiataz","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Marcos","lastName":"Da Costa","fullName":"Marcos Da Costa","class":"Journeyman","local":"1331.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Marcos","lastName":"Dias","fullName":"Marcos Dias","class":"Journeyman","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Mario","lastName":"Prachum","fullName":"Mario Prachum","class":"Journeyman","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Mark","lastName":"Sabbagh","fullName":"Mark Sabbagh","class":"Journeyman","local":"40.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Iron Worker","crew":"Bridge Painting"},{"firstName":"Mark","lastName":"Sheats","fullName":"Mark Sheats","class":"Journeyman","local":"361.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Iron Worker","crew":"Bridge Painting"},{"firstName":"Mayron","lastName":"Sales","fullName":"Mayron Sales","class":"Journeyman","local":"1331.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Michael","lastName":"Dunigan","fullName":"Michael Dunigan","class":"Journeyman","local":"2353.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Michael","lastName":"Haffner","fullName":"Michael Haffner","class":"Journeyman","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Michael","lastName":"Kavouras","fullName":"Michael Kavouras","class":"Journeyman","local":"6.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Michael","lastName":"Maillis","fullName":"Michael Maillis","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Michail","lastName":"Mavroudis","fullName":"Michail Mavroudis","class":"","local":"","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Miltiadis","lastName":"Dovas","fullName":"Miltiadis Dovas","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Moacir","lastName":"Poleti Junior","fullName":"Moacir Poleti Junior","class":"Journeyman","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Moises","lastName":"Sotta Jr","fullName":"Moises Sotta Jr","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Nicholas","lastName":"Billiris","fullName":"Nicholas Billiris","class":"Journeyman","local":"476.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Nicholas","lastName":"Florence","fullName":"Nicholas Florence","class":"Apprentice 3rd","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Nicholas","lastName":"Lyras","fullName":"Nicholas Lyras","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Nicholis","lastName":"Camacho","fullName":"Nicholis Camacho","class":"Apprentice 3rd","local":"361.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Iron Worker","crew":"Bridge Painting"},{"firstName":"Nikitas","lastName":"Grillis","fullName":"Nikitas Grillis","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Oscar","lastName":"Monge","fullName":"Oscar Monge","class":"Journeyman","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Osman","lastName":"Gonzalez","fullName":"Osman Gonzalez","class":"Journeyman","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Pantelis","lastName":"Poullas","fullName":"Pantelis Poullas","class":"Journeyman","local":"806.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Paul","lastName":"Synowiec","fullName":"Paul Synowiec","class":"Journeyman","local":"361.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Iron Worker","crew":"Bridge Painting"},{"firstName":"Phil","lastName":"Dawson","fullName":"Phil Dawson","class":"Journeyman","local":"476.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Rafael","lastName":"De Castro","fullName":"Rafael  De Castro","class":"Journeyman","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Ramon","lastName":"Amparo","fullName":"Ramon Amparo","class":"Apprentice 2nd","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Raymond","lastName":"Roach","fullName":"Raymond Roach","class":"Journeyman","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Renato","lastName":"Martinez","fullName":"Renato Martinez","class":"Journeyman","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Richard","lastName":"Montero","fullName":"Richard Montero","class":"","local":"806.0","currentJob":"VN Ramps","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Rivaldo","lastName":"Dos Santos","fullName":"Rivaldo Dos Santos","class":"Apprentice 3rd","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Robert","lastName":"Young","fullName":"Robert Young","class":"Journeyman","local":"1331.0","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Romel","lastName":"Guzhnay","fullName":"Romel Guzhnay","class":"Apprentice 3rd","local":"806.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Ruben","lastName":"Vasquez","fullName":"Ruben Vasquez","class":"Journeyman","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Scott","lastName":"Lee","fullName":"Scott Lee","class":"Journeyman","local":"2353.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Sebastian","lastName":"Papadopoulos","fullName":"Sebastian Papadopoulos","class":"Journeyman","local":"476.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Sergio","lastName":"Manzano","fullName":"Sergio Manzano","class":"Journeyman","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Shane","lastName":"Young, Jr.","fullName":"Shane Young, Jr.","class":"Journeyman","local":"40.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Iron Worker","crew":"Bridge Painting"},{"firstName":"Smolenski (Moe)","lastName":"Xenikis","fullName":"Smolenski (Moe) Xenikis","class":"Journeyman","local":"476.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Terrence","lastName":"Chillious","fullName":"Terrence Chillious","class":"Journeyman","local":"806.0","currentJob":"D265343 Bove W&W2","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"test","lastName":"dummy","fullName":"test dummy","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Theofilos","lastName":"Mixis","fullName":"Theofilos  Mixis","class":"Journeyman","local":"806.0","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Thomas","lastName":"Gavinovich","fullName":"Thomas Gavinovich","class":"Journeyman","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Timothy","lastName":"Ladd","fullName":"Timothy Ladd","class":"Journeyman","local":"806.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Tony","lastName":"Murphy","fullName":"Tony Murphy","class":"Journeyman","local":"806.0","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Trevor","lastName":"Swan","fullName":"Trevor Swan","class":"Steward","local":"806.0","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Tyler","lastName":"Saracena","fullName":"Tyler Saracena","class":"Journeyman","local":"1331.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Tyrone","lastName":"Brown","fullName":"Tyrone Brown","class":"Journeyman","local":"806.0","currentJob":"D265343 Bove W&W2","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Valerio","lastName":"Bauermann","fullName":"Valerio Bauermann","class":"Journeyman","local":"1331.0","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Victoria","lastName":"Veloso","fullName":"Victoria Veloso","class":"Apprentice 1st","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Wayne","lastName":"Woolum","fullName":"Wayne Woolum","class":"Journeyman","local":"2353.0","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Wilmer","lastName":"Burgos Calderon","fullName":"Wilmer  Burgos Calderon","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Wilson","lastName":"Monteiro","fullName":"Wilson Monteiro","class":"Journeyman","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Yamil","lastName":"Figueroa","fullName":"Yamil Figueroa","class":"Journeyman","local":"806.0","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Yonis","lastName":"Cruz","fullName":"Yonis Cruz","class":"Journeyman","local":"806.0","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""}];
const CREW_OPTIONS = ['', 'Crew 1', 'Crew 2', 'Crew 3', 'Crew 4', 'Crew 5', 'Crew 6', 'Crew 7', 'Other'];
const DWL_ACTIVITIES = ['01 - Setup','02 - Rigging','03 - Build Containment','04 - Washing','05 - Blast & Prime','06 - Additional Coat','07 - Power Tool','08 - Intermediate','09 - Finish','10 - Remove Containment','11 - Remove Rigging','12 - Caulking'];
const DWL_CLASS_OPTIONS = ['JM','FM','QC','Steward','1st','2nd','3rd','4th'];
const DWL_LOCAL_OPTIONS = ['1','6','40','155','361','476','806','1331','2011','2353'];
const DWL_ACTIVITY_NUMBERS = Array.from({length:12},(_,i)=>String(i+1));
const DWL_OVER_OPTIONS = Array.from({length:24},(_,i)=>String(i+1));
const DWL_SMALL_HOUR_OPTIONS = Array.from({length:10},(_,i)=>String(i+1));

const mewpQuestions = [
  'Is the machine’s exterior in safe condition?',
  'Are the engine, battery, fuel, and fluid systems in safe condition?',
  'Are the hydraulic and structural components in safe condition?',
  'Is the work platform safe and properly equipped?',
  'Does the unit start and run properly?',
  'Do all movement, function, and safety controls work properly?',
  'Is the worksite safe for operation?',
  'Were any issues found that need correction before use?'
];

const pirHoldPoints = [
  '1. Pre Surface Preparation / Condition and Cleanliness',
  '2. Surface Preparation Monitoring',
  '3. Post Surface Preparation / Cleanliness and Profile',
  '4. Pre Application Prep / Surface Cleanliness',
  '5. Application Monitoring / Ambient Conditions',
  '6. Post Application / Application Defects',
  '7. Post Cure / Dry Film Thickness',
  '8. Nonconformance / Corrective Actions Follow-up',
  '9. Final Inspection',
  '10. Piece Markings Per Contract Drawings'
];

function esc(v){return String(v ?? '').replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]));}
function val(id){const el=document.getElementById(id); return el ? el.value.trim() : '';}

function parsePirTemp(value){
  if(value===undefined || value===null) return NaN;
  const cleaned=String(value).replace(/[^0-9.\-]/g,'').trim();
  if(!cleaned) return NaN;
  return Number(cleaned);
}
function pirRoundNum(n){return Number.isFinite(n) ? String(Math.round(n)) : '';}
function calcPirAmbientFromDryWet(dryF, wetF){
  const dryC=(dryF-32)*5/9;
  const wetC=(wetF-32)*5/9;
  if(!Number.isFinite(dryC) || !Number.isFinite(wetC) || wetC>dryC) return null;
  const pressure=1013.25; // standard sea-level pressure in hPa, good field approximation for this PIR.
  const sat=(c)=>6.112*Math.exp((17.62*c)/(243.12+c));
  const gamma=0.00066*(1+0.00115*wetC)*pressure;
  const vapor=sat(wetC)-gamma*(dryC-wetC);
  if(!Number.isFinite(vapor) || vapor<=0) return null;
  const rh=Math.max(0,Math.min(100,(vapor/sat(dryC))*100));
  const ln=Math.log(vapor/6.112);
  const dewC=(243.12*ln)/(17.62-ln);
  const dewF=dewC*9/5+32;
  return {rh, dewF};
}
function updatePirAmbientRow(i){
  const dryEl=document.getElementById('pirDry'+i);
  const wetEl=document.getElementById('pirWet'+i);
  const rhEl=document.getElementById('pirRH'+i);
  const surfEl=document.getElementById('pirSurf'+i);
  const dewEl=document.getElementById('pirDew'+i);
  const diffEl=document.getElementById('pirDiff'+i);
  if(!dryEl || !wetEl || !rhEl || !surfEl || !dewEl || !diffEl) return;
  const dry=parsePirTemp(dryEl.value);
  const wet=parsePirTemp(wetEl.value);
  const surface=parsePirTemp(surfEl.value);
  const calc=calcPirAmbientFromDryWet(dry, wet);
  if(calc){
    rhEl.value=pirRoundNum(calc.rh);
    dewEl.value=pirRoundNum(calc.dewF);
  } else if(!dryEl.value.trim() && !wetEl.value.trim()){
    rhEl.value='';
    dewEl.value='';
  }
  const dew=parsePirTemp(dewEl.value);
  if(Number.isFinite(surface) && Number.isFinite(dew)){
    diffEl.value=pirRoundNum(surface-dew);
  } else if(!surfEl.value.trim()){
    diffEl.value='';
  }
}
function setupPirAmbientCalcs(){
  [1,2,3,4].forEach(i=>{
    ['pirDry','pirWet','pirSurf','pirDew'].forEach(prefix=>{
      const el=document.getElementById(prefix+i);
      if(el){
        el.setAttribute('inputmode','decimal');
        el.addEventListener('input',()=>updatePirAmbientRow(i));
        el.addEventListener('change',()=>updatePirAmbientRow(i));
      }
    });
    ['pirRH','pirDew','pirDiff'].forEach(prefix=>{
      const el=document.getElementById(prefix+i);
      if(el) el.classList.add('pirAutoCalcField');
    });
    updatePirAmbientRow(i);
  });
}
function checked(name){const el=document.querySelector(`[name="${name}"]:checked`); return el ? el.value : '';}
function setPrint(html){document.querySelectorAll('.printPage').forEach(x=>x.remove()); const div=document.createElement('div'); div.className='printPage'; div.innerHTML=html; document.body.appendChild(div); currentPrint=html;}
function field(id,label,type='text',extra=''){return `<div><label for="${id}">${label}</label><input id="${id}" type="${type}" ${extra}></div>`;}
function textarea(id,label){return `<div><label for="${id}">${label}</label><textarea id="${id}"></textarea></div>`;}
function selectField(id,label,opts){return `<div><label for="${id}">${label}</label><select id="${id}">${opts.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select></div>`;}
function projectField(id,label='Project / Job'){return `<div><label for="${id}">${label}</label><select id="${id}" class="projectSelect">${PROJECT_OPTIONS.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select><input id="${id}Other" class="projectOther" type="text" placeholder="Enter project name" style="display:none;margin-top:8px"></div>`;}
function setupOtherProject(id){const sel=document.getElementById(id), other=document.getElementById(id+'Other'); if(!sel||!other)return; const sync=()=>{other.style.display = sel.value==='Other' ? 'block' : 'none'; if(sel.value==='Other') other.focus();}; sel.addEventListener('change',sync); sync();}
function projectValue(id){const sel=document.getElementById(id); if(!sel)return ''; return sel.value==='Other' ? val(id+'Other') : sel.value;}
function crewField(id,label='Crew'){return `<div><label for="${id}">${label}</label><select id="${id}" class="crewSelect">${CREW_OPTIONS.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select><input id="${id}Other" class="projectOther" type="text" placeholder="Enter crew" style="display:none;margin-top:8px"></div>`;}
function setupOtherCrew(id){const sel=document.getElementById(id), other=document.getElementById(id+'Other'); if(!sel||!other)return; const sync=()=>{other.style.display = sel.value==='Other' ? 'block' : 'none'; if(sel.value==='Other') other.focus();}; sel.addEventListener('change',sync); sync();}
function crewValue(id){const sel=document.getElementById(id); if(!sel)return ''; return sel.value==='Other' ? val(id+'Other') : sel.value;}
function dateToMMDDYY(dateValue){ const d = String(dateValue||''); const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return ''; return `${m[2]}${m[3]}${m[1].slice(2)}`; }
function dateToDisplay(dateValue){ const d = String(dateValue||''); const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return d; return `${m[2]}-${m[3]}-${m[1].slice(2)}`; }
function cleanFilePart(v){ return String(v||'').trim().replace(/[\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').slice(0,80); }
function formSaveTitle(type, dateValue, projectName=''){
  if(type === 'dsif') return dsifSaveTitle(dateValue, projectName);
  if(type === 'dwl') return dwlSaveTitle(dateValue, projectName);
  const prefix = type === 'pir' ? 'PIR' : (type === 'mewp' ? 'MEWP' : 'Daily Equipment Inspection');
  const datePart = dateToDisplay(dateValue) || 'No Date';
  const projectPart = cleanFilePart(projectName);
  return projectPart ? `${prefix} - ${datePart} - ${projectPart}` : `${prefix} - ${datePart}`;
}
function dateToDotMMDDYY(dateValue){ const d=String(dateValue||''); const m=d.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return ''; return `${m[2]}.${m[3]}.${m[1].slice(2)}`; }
function dateToSlashYYYY(dateValue){ const d=String(dateValue||''); const m=d.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return d; return `${m[2]}/${m[3]}/${m[1]}`; }
function fileProjectName(projectName){ return String(projectName||'').trim().replace(/[\/:*?"<>|]+/g,'-').replace(/\s+/g,'_').replace(/_+/g,'_').slice(0,120); }
function dsifSaveTitle(dateValue, projectName=''){ const datePart=dateToDotMMDDYY(dateValue)||'No.Date'; const projectPart=fileProjectName(projectName); return projectPart ? `DSIF_${datePart}_${projectPart}` : `DSIF_${datePart}`; }
function dwlSaveTitle(dateValue, projectName=''){ const datePart=dateToDotMMDDYY(dateValue)||'No.Date'; const projectPart=fileProjectName(projectName); return projectPart ? `DWL_${datePart}_${projectPart}` : `DWL_${datePart}`; }

function openPrintNow(msgId){
  const msg = msgId ? document.getElementById(msgId) : null;
  if (msg) msg.innerHTML = '';
  try {
    if (typeof window.print !== 'function') throw new Error('Print is not available in this browser');
    window.focus();
    window.print();
  } catch (err) {
    if (msg) msg.innerHTML = `<div class="notice">Print preview could not open: ${esc(err.message)}. Use the browser Share button and choose Print / Save as PDF.</div>`;
    console.error(err);
  }
}

function printPdfHelp(type){
  const label = type === 'pir' ? 'PIR' : (type === 'dsif' ? 'DSIF' : 'MEWP');
  return `<p class="tiny saveHelp"><b>Save / send:</b> Use this button, then choose Save as PDF. On iPhone, use Share from the print/PDF screen to text it, email it, or save/send to Dropbox.</p>`;
}
function localPhotoFiles(inputId){ const inp=document.getElementById(inputId); if(!inp) return []; return [...inp.files].filter(f=>f.type.startsWith('image/')).map(f=>({originalName:f.name, mimetype:f.type, url:URL.createObjectURL(f)})); }
function radioBlock(name){return `<div class="choiceBtns"><label><input type="radio" name="${name}" value="YES">YES</label><label><input type="radio" name="${name}" value="NO">NO</label><label><input type="radio" name="${name}" value="N/A">N/A</label></div>`;}
function photoInput(id,label='Photos / attached pages'){return `<div><label for="${id}">${label}</label><input id="${id}" type="file" accept="image/*,.pdf" multiple><p class="tiny">Photos can be attached to the printed/PDF report. Image photos will show in print preview.</p><div id="${id}Preview" class="photoGrid"></div></div>`;}
function setupPhotoPreview(inputId){const input=document.getElementById(inputId), preview=document.getElementById(inputId+'Preview'); if(!input||!preview)return; input.addEventListener('change',()=>{preview.innerHTML=''; [...input.files].forEach(f=>{ if(f.type.startsWith('image/')){ const img=document.createElement('img'); img.src=URL.createObjectURL(f); preview.appendChild(img);} else { const p=document.createElement('div'); p.className='notice'; p.textContent=f.name; preview.appendChild(p);} });});}

function mixBlockForm(i){
  return `<div class="panel innerPanel mixBlock" data-mix="${i}"><h3>Mix / Application Block ${i}</h3><div class="grid four">${field('pirMixLoc'+i,'Location')}${field('pirMixTime'+i,'Time','time')}${selectField('pirMixWitness'+i,'Mix Witnessed and Acceptable',['','YES','NO','N/A'])}${field('pirBatchA'+i,'Batch # A')}${field('pirMfgA'+i,'A Mfg Date')}${field('pirShelfA'+i,'A Shelf Life')}${field('pirBatchB'+i,'Batch # B')}${field('pirMfgB'+i,'B Mfg Date')}${field('pirShelfB'+i,'B Shelf Life')}${field('pirDust'+i,'Dust')}${field('pirThinner'+i,'Thinner Type')}${field('pirVolume'+i,'% By Volume')}${field('pirMfr'+i,'Mfr')}${field('pirProd'+i,'Prod. Name')}${field('pirColor'+i,'Color')}${field('pirKit'+i,'Kit Sz/Cond.')}${field('pirPot'+i,'Pot Life')}${field('pirShelf'+i,'Shelf Life')}${field('pirInduction'+i,'Induction Time')}${field('pirTemp'+i,'Temperature')}${field('pirQty'+i,'Quantity Mixed')}${field('pirStart'+i,'Start')}${field('pirFinish'+i,'Finish / Stop')}${field('pirGallons'+i,'Total Gallons')}${field('pirSystem'+i,'Coat / System')}${field('pirMethod'+i,'Application Method')}${field('pirGunTip'+i,'Gun/Tip Size')}${field('pirElapsed'+i,'Time elapsed between coats')}${field('pirDFTPrev'+i,'DFT Avg. Previous Coat')}</div></div>`;
}
function renderPirMixBlocks(){
  const box=document.getElementById('pirMixBlocks');
  if(!box) return;
  box.innerHTML=Array.from({length:pirMixCount},(_,idx)=>mixBlockForm(idx+1)).join('');
  const btn=document.getElementById('addPirMixBlock');
  if(btn) btn.style.display = pirMixCount >= 4 ? 'none' : 'inline-block';
}
function sigField(id,label){
  return `<div class="signatureWrap"><label>${label}</label><div id="${id}Preview" class="signaturePreview signatureBtn" role="button" tabindex="0" data-sig="${id}" data-label="${esc(label)}">Tap here to sign</div></div>`;
}
function initSignatureButtons(){
  document.querySelectorAll('.signatureBtn').forEach(btn=>{
    const open=()=>openSignatureModal(btn.dataset.sig, btn.dataset.label || 'Signature');
    btn.onclick=open;
    btn.onkeydown=(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); open(); } };
  });
}
function openSignatureModal(targetId, title){
  const old=document.getElementById('sigModal'); if(old) old.remove();
  const div=document.createElement('div');
  div.id='sigModal'; div.className='sigModal';
  div.innerHTML=`<div class="sigBox"><h2>${esc(title)}</h2><p class="tiny">Use your finger on a phone/tablet, or your mouse on a computer.</p><canvas id="sigCanvas" width="720" height="260"></canvas><div class="actions"><button class="btn" id="sigSave">Use Signature</button><button class="btn light" id="sigClear">Clear</button><button class="btn danger" id="sigCancel">Cancel</button></div></div>`;
  document.body.appendChild(div);
  const canvas=document.getElementById('sigCanvas'); const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.strokeStyle='#000'; ctx.lineWidth=3; ctx.lineCap='round';
  let drawing=false;
  const pos=(e)=>{const r=canvas.getBoundingClientRect(); const t=e.touches?e.touches[0]:e; return {x:(t.clientX-r.left)*(canvas.width/r.width), y:(t.clientY-r.top)*(canvas.height/r.height)};};
  const start=e=>{e.preventDefault(); drawing=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y);};
  const move=e=>{if(!drawing)return; e.preventDefault(); const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke();};
  const end=e=>{if(e) e.preventDefault(); drawing=false;};
  canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move); window.addEventListener('mouseup',end,{once:false});
  canvas.addEventListener('touchstart',start,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false}); canvas.addEventListener('touchend',end,{passive:false});
  document.getElementById('sigClear').onclick=()=>{ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);};
  document.getElementById('sigCancel').onclick=()=>div.remove();
  document.getElementById('sigSave').onclick=()=>{signatureStore[targetId]=canvas.toDataURL('image/png'); const prev=document.getElementById(targetId+'Preview'); if(prev) prev.innerHTML=`<img src="${signatureStore[targetId]}" alt="Signature">`; div.remove();};
}
function sigPrint(dataUrl, typed){return dataUrl ? `<img class="sigPrint" src="${dataUrl}">` : esc(typed || '');}


function home(){
  app.innerHTML=`<div class="container printOnly homeContainer">
    <section class="homeIntro">
      <h1>JAGD Field Forms</h1>
      <p>Choose a form below. Each form is field-friendly for phones and can be saved as a PDF, then texted, emailed, or sent to Dropbox.</p>
    </section>
    <section class="formLibrary" aria-label="Form Library">
      <a class="formCard" href="#/dwl">
        <div>
          <span class="formTag">Daily Log</span>
          <h2>Daily Work Log</h2>
          <p>DWL 4.0 field log with employee autocomplete, no-lunch tracking, crews, weather, and one-page PDF output.</p>
        </div>
        <strong>Open</strong>
      </a>
      <a class="formCard" href="#/pir">
        <div>
          <span class="formTag">Paint / QC</span>
          <h2>Paint Inspection Report</h2>
          <p>Questionnaire-style field form that prints to the one-page PIR layout.</p>
        </div>
        <strong>Open</strong>
      </a>
      <a class="formCard" href="#/mewp">
        <div>
          <span class="formTag">Equipment</span>
          <h2>MEWP Daily Inspection</h2>
          <p>Separate MEWP checklist with pass/fail/N/A, notes, pictures, and finger signature.</p>
        </div>
        <strong>Open</strong>
      </a>
      <a class="formCard" href="#/daily-equipment">
        <div>
          <span class="formTag">Original Equipment</span>
          <h2>Daily Equipment Inspection</h2>
          <p>The existing JAGD web-based form, kept with the same source/format the PM already built.</p>
        </div>
        <strong>Open</strong>
      </a>
      <a class="formCard" href="#/dsif">
        <div>
          <span class="formTag">Safety</span>
          <h2>Daily Safety Inspection Form</h2>
          <p>DSIF questionnaire that prints to the two-page safety inspection layout.</p>
        </div>
        <strong>Open</strong>
      </a>
      <a class="formCard" href="#/weekly-safety">
        <div>
          <span class="formTag">Safety Meeting</span>
          <h2>Weekly Safety Meeting</h2>
          <p>Foreman starts a meeting, displays a QR code, and workers sign in from their phones.</p>
        </div>
        <strong>Open</strong>
      </a>
    </section>
  </div>`;
}

function pirForm(){
  app.innerHTML=`<div class="container printOnly"><h1>Paint Inspection Report Questionnaire</h1><div class="pirOnePage">
    <div id="pir-project" class="panel"><h2>Project Information</h2><div class="grid three">${projectField('pirProject','Project')} ${field('pirReportDate','Report Date','date')} ${field('pirDay','Day','text','readonly')} ${field('pirWeatherAM','Weather AM')} ${field('pirWeatherPM','Weather PM')} ${field('pirInspectionReport','Inspection Report #')}</div></div>
    <div id="pir-hold" class="panel"><h2>Hold Point Inspections Performed</h2><div class="grid two">${pirHoldPoints.map((q,i)=>`<div class="checkrow"><div class="questionTitle">${q}</div>${radioBlock('pirHold'+i)}</div>`).join('')}</div></div>
    <div id="pir-surface" class="panel"><h2>Surface Cleanliness / Profile Measurement</h2><div class="grid three">${field('pirSurfacesPrepared','Surfaces Prepared Per Specification')} ${field('pirSSPC','SSPC/NACE SP')} ${field('pirSpecifiedProfile','Specified Profile')} ${field('pirProfileCheck','Profile Check')} ${selectField('pirAbrasiveTest','Abrasive Test Acceptable',['','YES','NO','N/A'])} ${selectField('pirBlotterTest','Blotter Test Acceptable',['','YES','NO','N/A'])} ${field('pirChloride1','Chloride ug/cm²')} ${field('pirChloride2','Chloride ug/cm²')} ${selectField('pirIllumination','Illumination Acceptable',['','YES','NO','N/A'])}</div></div>
    <div id="pir-testex" class="panel"><h2>Testex Tape Inserts</h2><div class="testexScreenGrid">${[1,2,3].map(i=>`<div class="testexCard"><div class="testexBox screen"><span>Insert Testex Tape Here</span></div>${field('pirTestexLoc'+i,'Tape '+i+' Location / Area')}${field('pirTestexReading'+i,'Tape '+i+' Profile Reading')}${field('pirTestexNotes'+i,'Tape '+i+' Notes')}</div>`).join('')}</div></div>
    <div id="pir-instruments" class="panel"><h2>Calibrated QC Equipment</h2><div class="grid three">${['Sling Psychrometer','Surface Temperature Gage','Calibration Plates','Micrometer','Positector','Wet Film Thickness Gage','Inspection Equip inspected in last 12 Months?'].map((n,i)=>`<div class="checkrow"><label>${n}</label>${selectField('pirInstYes'+i,'Status',['YES','NO','N/A'])}${field('pirInstSerial'+i,'Serial Number')}${i===4?field('pirPosiAdjust','PA-2 Adjustment made') : ''}</div>`).join('')}</div></div>
    <div id="pir-ambient" class="panel"><h2>Ambient Conditions</h2><p class="tiny"><b>Auto-calc:</b> Enter Dry Bulb + Wet Bulb to calculate % Relative Humidity and Dew Point. Enter Surface Temp to calculate Surface Temp. - Dew Point Spread.</p><div class="grid four">${[1,2,3,4].map(i=>`<div class="checkrow"><h3>Reading ${i}</h3>${field('pirAmbLoc'+i,'Location')}${field('pirAmbTime'+i,'Time','time')}${field('pirDry'+i,'Dry Bulb Temp')}${field('pirWet'+i,'Wet Bulb Temp')}${field('pirRH'+i,'% Relative Humidity')}${field('pirSurf'+i,'Surface Temp')}${field('pirDew'+i,'Dew Point')}${field('pirDiff'+i,'Surface Temp. - Dew Point Spread')}</div>`).join('')}</div></div>
    <div id="pir-mixing" class="panel"><h2>Mixing / Application</h2><div id="pirMixBlocks"></div><div class="actions"><button type="button" class="btn light" id="addPirMixBlock">+ Add another Mix / Application Block</button></div></div>
    <div id="pir-caulk" class="panel"><h2>Caulking / Signatures</h2><div class="grid three">${field('pirCaulkLocation','Caulking Location')} ${field('pirCaulkNameBatch','Name / Batch')} ${field('pirTubeSize','Tube Size')} ${field('pirCaulkShelf','Shelf Life')} ${field('pirTotalUsed','Total Amount Used')} ${field('pirQCPrint','QC Print')} ${sigField('pirQCSignature','QC Signature')} ${sigField('pirQCSSignature','QCS Signature')}</div>${textarea('pirGeneralNotes','General Notes / Nonconformance / Corrective Actions')}<div class="actions"><button class="btn" id="pirPrintBtn">Save PDF / Print PIR</button></div>${printPdfHelp('pir')}<div id="pirMsg"></div></div>
  </div></div>`;
  const dateEl=document.getElementById('pirReportDate');
  const dayEl=document.getElementById('pirDay');
  const reportEl=document.getElementById('pirInspectionReport');
  const updateDay=()=>{ if(!dateEl.value){dayEl.value=''; return;} const d=new Date(dateEl.value+'T00:00:00'); dayEl.value=d.toLocaleDateString(undefined,{weekday:'long'}); };
  const updateReportNumber=()=>{ if(reportEl) reportEl.value = dateToMMDDYY(dateEl.value); };
  setupOtherProject('pirProject');
  dateEl.value=new Date().toISOString().slice(0,10);
  updateDay();
  updateReportNumber();
  dateEl.addEventListener('change', ()=>{ updateDay(); updateReportNumber(); });
  pirMixCount=1; renderPirMixBlocks();
  setupPirAmbientCalcs();
  document.getElementById('addPirMixBlock').onclick=()=>{pirMixCount=Math.min(4,pirMixCount+1); renderPirMixBlocks();};
  initSignatureButtons();
  document.getElementById('pirPrintBtn').onclick=(e)=>{e.preventDefault(); try{const data=collectPir(); document.title = formSaveTitle('pir', data.reportDate, data.project); buildPirPrint(data); openPrintNow('pirMsg');}catch(err){const msg=document.getElementById('pirMsg'); if(msg) msg.innerHTML=`<div class="notice">Print preview could not open: ${esc(err.message)}.</div>`; console.error(err);} };
}

function collectPir(){
 const data={project:projectValue('pirProject'),reportDate:val('pirReportDate'),day:val('pirDay'),weatherAM:val('pirWeatherAM'),weatherPM:val('pirWeatherPM'),inspectionReport:val('pirInspectionReport'),attachedPages:'',page:'1',pageOf:'1',holdPoints:pirHoldPoints.map((q,i)=>({q,status:checked('pirHold'+i)})),surfacesPrepared:val('pirSurfacesPrepared'),sspc:val('pirSSPC'),specifiedProfile:val('pirSpecifiedProfile'),profileCheck:val('pirProfileCheck'),abrasiveTest:val('pirAbrasiveTest'),blotterTest:val('pirBlotterTest'),chloride1:val('pirChloride1'),chloride2:val('pirChloride2'),illumination:val('pirIllumination'),testex:[1,2,3].map(i=>({location:val('pirTestexLoc'+i),reading:val('pirTestexReading'+i),notes:val('pirTestexNotes'+i)})),posiAdjust:val('pirPosiAdjust'),generalNotes:val('pirGeneralNotes'),qcPrint:val('pirQCPrint'),qcSignature:val('pirQCSignature'),qcsSignature:val('pirQCSSignature'),caulking:{location:val('pirCaulkLocation'),nameBatch:val('pirCaulkNameBatch'),tubeSize:val('pirTubeSize'),shelf:val('pirCaulkShelf'),totalUsed:val('pirTotalUsed')}};
 data.instruments=['Sling Psychrometer','Surface Temperature Gage','Calibration Plates','Micrometer','Positector','Wet Film Thickness Gage','Inspection Equip inspected in last 12 Months?'].map((n,i)=>({name:n,status:val('pirInstYes'+i),serial:val('pirInstSerial'+i)}));
 data.ambient=[1,2,3,4].map(i=>({location:val('pirAmbLoc'+i),time:val('pirAmbTime'+i),dry:val('pirDry'+i),wet:val('pirWet'+i),rh:val('pirRH'+i),surface:val('pirSurf'+i),dew:val('pirDew'+i),diff:val('pirDiff'+i)}));
 data.mixing=Array.from({length:pirMixCount},(_,idx)=>idx+1).map(i=>({location:val('pirMixLoc'+i),time:val('pirMixTime'+i),witness:val('pirMixWitness'+i),batchA:val('pirBatchA'+i),mfgA:val('pirMfgA'+i),shelfA:val('pirShelfA'+i),batchB:val('pirBatchB'+i),mfgB:val('pirMfgB'+i),shelfB:val('pirShelfB'+i),dust:val('pirDust'+i),thinner:val('pirThinner'+i),volume:val('pirVolume'+i),mfr:val('pirMfr'+i),prod:val('pirProd'+i),color:val('pirColor'+i),kit:val('pirKit'+i),pot:val('pirPot'+i),shelf:val('pirShelf'+i),induction:val('pirInduction'+i),temp:val('pirTemp'+i),qty:val('pirQty'+i),start:val('pirStart'+i),finish:val('pirFinish'+i),gallons:val('pirGallons'+i),system:val('pirSystem'+i),method:val('pirMethod'+i),gunTip:val('pirGunTip'+i),elapsed:val('pirElapsed'+i),dftPrev:val('pirDFTPrev'+i)}));
 data.qcSignatureData=signatureStore.pirQCSignature || ''; data.qcsSignatureData=signatureStore.pirQCSSignature || ''; data.mixingCount=pirMixCount;
 return data;
}

function buildPirPrint(data=collectPir(), files=[]){
 const hp = data.holdPoints || [];
 const inst = data.instruments || [];
 const amb = data.ambient || [];
 const mix = data.mixing || [];
 const cell=(x)=>esc(x||'');
 const instRows=['Sling Psychrometer','Surface Temperature Gage','Calibration Plates','Micrometer','Positector','Wet Film Thickness Gage','Inspection Equip inspected in last 12 Months?'].map((n,i)=>{
   const row=inst[i]||{}; return `<div class="pirCell tinyCell">${cell(row.status||'YES')}</div><div class="pirCell tinyCell">${cell(n)}</div><div class="pirCell tinyCell">${cell(row.serial)}</div>`;
 }).join('') + `<div class="pirCell tinyCell">YES</div><div class="pirCell tinyCell">Posi verified as per PA-2?</div><div class="pirCell tinyCell">Adjustment made: ${cell(data.posiAdjust)}</div>`;
 const ambHead=`<div class="pirCell tinyCell"></div>${amb.map(a=>`<div class="pirCell tinyCell center">${cell(a.location)}</div>`).join('')}`;
 const ambRows=[['Time','time'],['Dry Bulb Temp','dry'],['Wet Bulb Temp','wet'],['% Relative Humidity','rh'],['Surface Temp.','surface'],['Dew Point','dew'],['Surface Temp. - Dew Point Spread','diff']].map(([label,key])=>`<div class="pirCell tinyCell">${label}</div>${amb.map(a=>`<div class="pirCell tinyCell center">${cell(a[key])}</div>`).join('')}`).join('');
 const mixBlock=(m={})=>`<div class="mixPrintBlock"><div class="mixRow"><span><b>Location:</b> ${cell(m.location)}</span><span><b>Time:</b> ${cell(m.time)}</span></div><div class="mixHead">Batch #'s <span>Mix Witnessed and Acceptable ${cell(m.witness)}</span></div><div class="mixGrid"><span>(A) ${cell(m.batchA)}</span><span>Mfg Date ${cell(m.mfgA)}</span><span>Shelf Life ${cell(m.shelfA)}</span><span>(B) ${cell(m.batchB)}</span><span>Mfg Date ${cell(m.mfgB)}</span><span>Shelf Life ${cell(m.shelfB)}</span><span>Dust ${cell(m.dust)}</span><span>Thinner Type ${cell(m.thinner)}</span><span>% By Volume ${cell(m.volume)}</span><span>Mfr: ${cell(m.mfr)}</span><span>Prod. Name: ${cell(m.prod)}</span><span>Color: ${cell(m.color)}</span><span>Kit Sz/Cond.: ${cell(m.kit)}</span><span>Pot Life: ${cell(m.pot)}</span><span>Shelf Life: ${cell(m.shelf)}</span><span>Induction Time: ${cell(m.induction)}</span><span>Temperature: ${cell(m.temp)}</span><span>Quantity Mixed: ${cell(m.qty)}</span></div><div class="mixHead">Application</div><div class="mixGrid app"><span>Start: ${cell(m.start)}</span><span>Finish/Stop: ${cell(m.finish)}</span><span>Total Gallons: ${cell(m.gallons)}</span><span>Coat: ${cell(m.system)}</span><span>Method: ${cell(m.method)}</span><span>Gun/Tip Size: ${cell(m.gunTip)}</span><span>DFT Avg. Previous Coat: ${cell(m.dftPrev)}</span><span>Time elapsed between coats: ${cell(m.elapsed)}</span></div></div>`;
 const fourMix=[0,1,2,3].map(i=>mixBlock(mix[i]||{})).join('');
 const testex=[0,1,2].map(i=>`<div class="testexBox pirTestexPrint"><span>Insert Testex Tape Here</span></div><div class="testexMeta">${cell(data.testex?.[i]?.location)} ${cell(data.testex?.[i]?.reading)} ${cell(data.testex?.[i]?.notes)}</div>`).join('');
 const holdText=pirHoldPoints.map((q,i)=>`${cell(q)} ${cell(hp[i]?.status)}`).join('<br>');
 const html=`<div class="pirSheetV7">
   <div class="pirHeaderV7">
     <div class="pirHLeft"><b>Project:</b> ${cell(data.project)}<br><b>Report Date:</b> ${cell(data.reportDate)}<br><b>Attached Pages:</b></div>
     <div class="pirHLogo"><img src="${logo}"></div>
     <div class="pirHTitle"><b>Paint Inspection Report</b></div>
     <div class="pirHRight"><b>Weather:</b> AM ${cell(data.weatherAM)} &nbsp; PM ${cell(data.weatherPM)}</div>
     <div class="pirHDay"><b>DAY:</b> ${cell(data.day)}</div>
     <div class="pirHReport"><b>Inspection Report #:</b> ${cell(data.inspectionReport)}</div>
     <div class="pirHPage"><b>Page:</b> 1 of 1</div>
   </div>
   <div class="pirTopV7">
     <div class="pirTopCol"><div class="pirBar">Hold Point Inspections Performed</div><div class="pirTopBody">${holdText}</div></div>
     <div class="pirTopCol"><div class="pirBar">Surface Cleanliness</div><div class="pirTopBody">Surfaces Prepared Per Specification: ${cell(data.surfacesPrepared)}<br>SSPC/NACE SP: ${cell(data.sspc)}<br>Profile Check: ${cell(data.profileCheck)}<br>Tape / Specified Profile: ${cell(data.specifiedProfile)}<br>Abrasive Test Acceptable: ${cell(data.abrasiveTest)}<br>Blotter Test Acceptable: ${cell(data.blotterTest)}<br>Chloride: ${cell(data.chloride1)} ug/cm²<br>Chloride: ${cell(data.chloride2)} ug/cm²<br>Illumination Acceptable: ${cell(data.illumination)}</div></div>
     <div class="pirTopCol"><div class="pirBar">Profile Measurement</div><div class="pirTestexStackV7">${testex}</div></div>
   </div>
   <div class="pirIAHead">Instruments / Ambient Conditions</div>
   <div class="pirIAV7">
     <div class="pirInstGrid">${instRows}</div>
     <div class="pirAmbGrid">${ambHead}${ambRows}</div>
   </div>
   <div class="pirMixHeadV7">Mixing / Application</div>
   <div class="pirMixGridV7">${fourMix}</div>
   <div class="pirCaulkHeadV7">Caulking</div>
   <div class="pirCaulkGridV7"><div>Location: ${cell(data.caulking?.location)}</div><div>Name/Batch: ${cell(data.caulking?.nameBatch)}</div><div>Tube Size: ${cell(data.caulking?.tubeSize)}</div><div>Shelf Life: ${cell(data.caulking?.shelf)}</div><div>Total Amount Used: ${cell(data.caulking?.totalUsed)}</div></div>
   <div class="pirSigGridV7"><div>QC Print: ${cell(data.qcPrint)}</div><div>QC Signature: ${sigPrint(data.qcSignatureData,data.qcSignature)}</div><div>QCS Signature: ${sigPrint(data.qcsSignatureData,data.qcsSignature)}</div></div>
   <div class="pirRevV7">PIR Revision 0</div>
 </div>`;
 setPrint(html); return html;
}

function mewpForm(){
 app.innerHTML=`<div class="container printOnly"><h1>MEWP Daily Equipment Inspection</h1><div class="panel"><h2>Equipment / Job Information</h2><div class="grid three">${projectField('mewpJobName','Project / Job')} ${field('mewpLocation','Location / Work Area')} ${field('mewpDate','Inspection Date','date')} ${field('mewpTime','Inspection Time','time')} ${field('mewpInspector','Inspector Name')} ${field('mewpCompany','Company','text','value="JAGD Construction"')} ${field('mewpEquipmentId','Equipment ID / Unit #')} ${field('mewpMakeModel','Make / Model')} ${field('mewpSerial','Serial #')} ${field('mewpHours','Hour Meter')} ${field('mewpOperator','Operator')} ${selectField('mewpOverall','Overall Status',['Ready for Use','Do Not Use - Correction Required','N/A'])}</div></div><div class="panel"><h2>MEWP Checklist</h2>${mewpQuestions.map((q,i)=>`<div class="checkrow"><div class="questionTitle">${i+1}. ${q}</div><div class="choiceBtns"><label><input type="radio" name="mewpQ${i}" value="PASS">PASS</label><label><input type="radio" name="mewpQ${i}" value="FAIL">FAIL</label><label><input type="radio" name="mewpQ${i}" value="N/A">N/A</label></div><label>Notes / corrective action</label><textarea id="mewpNote${i}"></textarea></div>`).join('')}</div><div class="panel"><h2>Pictures / Signature</h2>${photoInput('mewpPhotos','Pictures')}${textarea('mewpGeneralNotes','General Notes')}${sigField('mewpSignature','Inspector Signature')}<div class="actions"><button class="btn" id="mewpPrintBtn">Save PDF / Print MEWP</button></div>${printPdfHelp('mewp')}<div id="mewpMsg"></div></div></div>`;
 setupOtherProject('mewpJobName');
 setupPhotoPreview('mewpPhotos');
 document.getElementById('mewpDate').value=new Date().toISOString().slice(0,10);
 initSignatureButtons();
 document.getElementById('mewpPrintBtn').onclick=(e)=>{e.preventDefault(); try{const data=collectMewp(); document.title = formSaveTitle('mewp', data.inspectionDate, data.jobName); buildMewpPrint(data, localPhotoFiles('mewpPhotos')); openPrintNow('mewpMsg');}catch(err){const msg=document.getElementById('mewpMsg'); if(msg) msg.innerHTML=`<div class="notice">Print preview could not open: ${esc(err.message)}.</div>`; console.error(err);} };
}
function collectMewp(){return {jobName:projectValue('mewpJobName'),location:val('mewpLocation'),inspectionDate:val('mewpDate'),time:val('mewpTime'),inspector:val('mewpInspector'),company:val('mewpCompany'),equipmentId:val('mewpEquipmentId'),makeModel:val('mewpMakeModel'),serial:val('mewpSerial'),hours:val('mewpHours'),operator:val('mewpOperator'),overall:val('mewpOverall'),generalNotes:val('mewpGeneralNotes'),signature:val('mewpSignature'),signatureData:signatureStore.mewpSignature||'',questions:mewpQuestions.map((q,i)=>({q,status:checked('mewpQ'+i),notes:val('mewpNote'+i)}))};}
function buildMewpPrint(data=collectMewp(), files=[]){const rows=(data.questions||[]).map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.q)}</td><td>${esc(x.status)}</td><td>${esc(x.notes)}</td></tr>`).join(''); const html=`<div class="mewpSheet"><div class="mewpHeader"><img src="${logo}"><div class="mewpTitle">MEWP Daily Equipment Inspection<br><span style="font-size:12px;font-weight:400">JAGD Construction</span></div></div><table class="printTable"><tr><td><b>Project / Job:</b> ${esc(data.jobName)}</td><td><b>Location:</b> ${esc(data.location)}</td><td><b>Date:</b> ${esc(data.inspectionDate)}</td></tr><tr><td><b>Inspector:</b> ${esc(data.inspector)}</td><td><b>Time:</b> ${esc(data.time)}</td><td><b>Overall Status:</b> ${esc(data.overall)}</td></tr><tr><td><b>Equipment ID:</b> ${esc(data.equipmentId)}</td><td><b>Make / Model:</b> ${esc(data.makeModel)}</td><td><b>Serial #:</b> ${esc(data.serial)}</td></tr><tr><td><b>Hour Meter:</b> ${esc(data.hours)}</td><td><b>Operator:</b> ${esc(data.operator)}</td><td><b>Company:</b> ${esc(data.company)}</td></tr></table><h3>Inspection Checklist</h3><table class="printTable"><tr><th>#</th><th>Inspection Item</th><th>Status</th><th>Notes / Corrective Action</th></tr>${rows}</table><p><b>General Notes:</b> ${esc(data.generalNotes)}</p><p><b>Inspector Signature:</b> ${data.signatureData?`<img class="sigPrint" src="${data.signatureData}">`:esc(data.signature)}</p>${files.length?`<h3>Pictures</h3><div class="photoPrint">${files.filter(f=>String(f.mimetype||'').startsWith('image/')).map(f=>`<img src="${f.url}">`).join('')}</div>`:''}</div>`; setPrint(html); return html;}
async function saveForm(type,data,photoInputId,msgId){const msg=document.getElementById(msgId); msg.innerHTML='<div class="notice">Saving...</div>'; const fd=new FormData(); fd.append('type',type); fd.append('data',JSON.stringify(data)); const inp=document.getElementById(photoInputId); if(inp){[...inp.files].forEach(f=>fd.append('photos',f));} try{const res=await fetch('/api/submissions',{method:'POST',body:fd}); const json=await res.json(); if(!res.ok) throw new Error(json.error||'Save failed'); msg.innerHTML=`<div class="success">Saved as: ${esc(json.title || json.record?.title || json.id)}</div>`;}catch(e){msg.innerHTML=`<div class="notice">Could not save: ${esc(e.message)}. You can still print from this screen.</div>`;}}
async function submissions(){app.innerHTML=`<div class="container printOnly"><h1>Saved Submissions</h1><div class="actions"><button class="btn" onclick="loadSubmissions()">Refresh</button><a class="btn light" href="#/">Back</a></div><div id="savedList" class="panel">Loading...</div></div>`; await loadSubmissions();}
async function loadSubmissions(){const box=document.getElementById('savedList'); try{const rows=await (await fetch('/api/submissions')).json(); if(!rows.length){box.innerHTML='<p>No saved submissions yet.</p>';return;} box.innerHTML=`<table class="table"><tr><th>Saved</th><th>Form</th><th>Saved Name</th><th>Project / Job</th><th>Open</th></tr>${rows.map(r=>`<tr><td>${new Date(r.createdAt).toLocaleString()}</td><td>${esc(r.type).toUpperCase()}</td><td>${esc(r.title)}</td><td>${esc(r.project)}</td><td><button class="btn small" onclick="openSubmission('${r.id}')">Open</button></td></tr>`).join('')}</table>`;}catch(e){box.innerHTML=`<div class="notice">Could not load saved submissions: ${esc(e.message)}</div>`;}}
async function openSubmission(id){const record=await (await fetch('/api/submissions/'+id)).json(); if(record.type==='pir') buildPirPrint(record.data, record.files||[]); else buildMewpPrint(record.data, record.files||[]); setTimeout(()=>window.print(), 100);}


const DAILY_EQUIPMENT_CHECKLISTS = [
  { key:'air-compressor', title:'Air Compressor – Daily Inspection Checklist', items:['Engine oil level correct','Coolant level correct','Fuel level sufficient','No visible fluid leaks','Air filters clean','Moisture drained from system','Hoses and fittings secure','Guards and covers secure','Gauges operating properly','Emergency shutdown functional'] },
  { key:'dust-collector', title:'Dust Collector – Daily Inspection Checklist', items:['Guards and access panels secure','Emergency stops functional','Warning labels legible','No visible damage or leaks','Filter bags/cartridges intact','Differential pressure normal','Hopper free of buildup','Dust discharge operating','Control panel indicators normal','No alarm conditions present'] },
  { key:'blast-machine', title:'Blast Machine – Daily Inspection Checklist', items:['Machine frame and guards intact','Emergency stop functional','Access doors secured','Screens free of blockage','Magnetic separator clean','Conveyors operating smoothly','Air lines free of leaks','Bearings lubricated','No abnormal vibration or noise'] },
  { key:'vacuum', title:'Vacuum – Daily Inspection Checklist', items:['Blower operating normally (28&quot; Hg)','Hoses free of damage','Boom and joints operate smoothly','Tank free of excessive buildup','Rear door seals intact','Door latching secure','Sludge pump functional','Valves operate smoothly','No hydraulic leaks observed'] }
];
function dailyStatusButtons(pageIndex,itemIndex){return `<div class="choiceBtns dailyChoice"><label><input type="radio" name="daily_${pageIndex}_${itemIndex}" value="OK">OK</label><label><input type="radio" name="daily_${pageIndex}_${itemIndex}" value="Needs Attention">Needs Attention</label></div>`;}
function dailyEquipmentForm(){
  app.innerHTML=`<div class="container printOnly dailyLocalContainer">
    <h1>Daily Equipment Inspection</h1>
    <div class="panel"><h2>Project / Inspector Information</h2><div class="grid three">${projectField('dailyProject','Project')} ${field('dailyDate','Date','date')} ${field('dailyInspector','Filled By / Printed Name')}</div>${sigField('dailySignature','Signature')}<p class="tiny">Fill out only the equipment used today. Mark the rest as N/A. Photos can be attached to each checklist section.</p></div>
    ${DAILY_EQUIPMENT_CHECKLISTS.map((page,pi)=>`<div class="panel dailyChecklist" data-page="${pi}"><div class="dailySectionHead"><h2>${page.title}</h2><label class="naBox"><input type="checkbox" id="dailyNa${pi}"> N/A</label></div>${page.items.map((q,ii)=>`<div class="checkrow dailyItem"><div class="questionTitle">${q}</div>${dailyStatusButtons(pi,ii)}<label>Comments</label><textarea id="dailyComment_${pi}_${ii}"></textarea></div>`).join('')} ${photoInput('dailyPhotos'+pi,'Photo Documentation')} ${textarea('dailyAdditional'+pi,'Additional Comments')}</div>`).join('')}
    <div class="panel"><div class="actions"><button class="btn light" id="dailyResetBtn" type="button">Reset</button><button class="btn" id="dailyPrintBtn" type="button">Save PDF / Print Daily Equipment Inspection</button></div><p class="tiny saveHelp"><b>Save / send:</b> Use Save PDF / Print, then choose Save as PDF. On iPhone, use Share from the print/PDF screen to text it, email it, or save/send to Dropbox.</p><div id="dailyMsg"></div></div>
  </div>`;
  setupOtherProject('dailyProject');
  document.getElementById('dailyDate').value=new Date().toISOString().slice(0,10);
  DAILY_EQUIPMENT_CHECKLISTS.forEach((_,pi)=>setupPhotoPreview('dailyPhotos'+pi));
  initSignatureButtons();
  document.getElementById('dailyResetBtn').onclick=()=>{ if(confirm('Reset this Daily Equipment Inspection form?')) dailyEquipmentForm(); };
  document.getElementById('dailyPrintBtn').onclick=(e)=>{e.preventDefault(); try{const data=collectDailyEquipment(); document.title=formSaveTitle('daily', data.date, data.project); buildDailyEquipmentPrint(data); openPrintNow('dailyMsg');}catch(err){document.getElementById('dailyMsg').innerHTML=`<div class="notice">Print preview could not open: ${esc(err.message)}.</div>`; console.error(err);}};
}
function collectDailyEquipment(){return {project:projectValue('dailyProject'),date:val('dailyDate'),inspector:val('dailyInspector'),signature:val('dailySignature'),signatureData:signatureStore.dailySignature||'',pages:DAILY_EQUIPMENT_CHECKLISTS.map((page,pi)=>({title:page.title,na:document.getElementById('dailyNa'+pi)?.checked||false,items:page.items.map((q,ii)=>({q:q.replace('&quot;','"'),status:checked('daily_'+pi+'_'+ii),comment:val('dailyComment_'+pi+'_'+ii)})),additional:val('dailyAdditional'+pi),photos:localPhotoFiles('dailyPhotos'+pi)}))};}
function buildDailyEquipmentPrint(data=collectDailyEquipment()){
  const dateLabel = (data.date||'').replace(/^(\d{4})-(\d{2})-(\d{2})$/,'$2/$3/$1');
  const pages = (data.pages||[]).filter(p=>!p.na);
  const list = pages.length ? pages : (data.pages||[]).slice(0,1);
  const html = list.map(page=>`<div class="dailyPrintSheet"><div class="dailyPrintHeader"><img src="${logo}"><div><h1>JAGD Construction</h1><h2>${esc(page.title)}</h2></div><span>1.0</span></div><div class="dailyProjectLine"><b>Project Name:</b> ${esc(data.project)}</div><table class="dailyPrintTable"><tr><th>Inspection / Maintenance Item</th><th>OK</th><th>Needs Attention</th><th>Comments</th></tr>${(page.items||[]).map(item=>`<tr><td>${esc(item.q)}</td><td class="centerMark">${item.status==='OK'?'✓':''}</td><td class="centerMark">${item.status==='Needs Attention'?'✓':''}</td><td>${esc(item.comment)}</td></tr>`).join('')}</table><h3>Photo Documentation</h3><div class="dailyPhotoBoxes">${[0,1,2,3].map(i=>`<div>${page.photos?.[i]?.url?`<img src="${page.photos[i].url}">`:''}</div>`).join('')}</div><p class="dailyComments"><b>Additional Comments:</b> ${esc(page.additional)}</p><div class="dailyPrintSig"><span><b>Name:</b> ${esc(data.inspector)}</span><span><b>Signature:</b> ${sigPrint(data.signatureData,data.signature)}</span><span><b>Date:</b> ${esc(dateLabel)}</span></div></div>`).join('');
  setPrint(html); return html;
}

const DSIF_SECTIONS = [
  {key:'platform', title:'Platform/Scaffold/Engineered Platform & Shield Systems', sub:'OSHA 1926 Subpart L', commentHeader:'Platform Repairs Performed', questions:[
    'Is the platform/scaffold/engineered system fully decked, secured, and free of loose or missing components?',
    'Is platform deflection (sag) within allowable limits per approved plans?',
    'Are all anchors, outriggers, and chokers properly installed, secured, and not overloaded?',
    'Are fall protection systems in place, including guardrails or 100% tie-off, with properly rated anchor points (5,000 lbs or engineered) and appropriate lanyards/SRLs in use?',
    'Are all rigging hoists and braking systems operational?',
    'Has a functionality check been completed on all equipment prior to use?',
    'Is safe access provided to all platforms/scaffolds/engineered systems?',
    'Is the drop zone established and controlled?',
    'Are wind and weather conditions verified to be within allowable limits for work? Wind Speed/Direction:',
    'Are approved plans for the platform/scaffold/engineered system available on site?',
    'Has a competent person inspection been completed, and is the system approved for use?'
  ]},
  {key:'blast', title:'Blast and Paint', sub:'Per OSHA 1926.57, 1910.107/AMPP/SSPC Guide 6&8', commentHeader:'Comments', questions:[
    'Are blast hoods and required PPE in use and in serviceable condition?',
    'Are all hoses, couplings, whip checks, and fittings properly secured and in good condition?',
    'Are deadman controls installed on all blast hoses and functioning properly?',
    'Are spray guns equipped with required safety devices (e.g., tip guards/knuckle guards), and are safety locks functional?',
    'Are required filters (organic vapor and particulate) inspected and within their service life?',
    'Are VOC and LEL levels within specified limits? Specification Limit:',
    'Is the air purifying system identified, and are filter change dates documented?',
    'Is a CO monitor present, calibrated, and functioning properly?',
    'Is all required monitoring equipment within calibration and verified operational (bump tested) prior to use?'
  ]},
  {key:'decon', title:'Decontamination Area', sub:'OSHA 1926.62 (Lead Standard)', commentHeader:'Comments', questions:[
    'Is a decontamination area/trailer present, accessible, and maintained in a clean and functional condition?',
    'Are employees utilizing handwashing stations prior to breaks?',
    'Does the decontamination trailer have required supplies (soap, water, towels, and clean work clothing)?',
    'Are employees exposed above the PEL utilizing shower facilities at the end of the work shift?',
    'Is contaminated (dirty) clothing handled, stored, and disposed of in accordance with project requirements?',
    'Are street clothes stored separately from contaminated work areas (clean side of decontamination area)?',
    'Are respirators properly maintained, cleaned, and stored?'
  ]},
  {key:'waste', title:'Waste Area', sub:'EPA 40 CFR 262/OSHA 1926.65', commentHeader:'Comments', questions:[
    'Is the hazardous waste storage area secure and waste properly stored?',
    'Is wastewater and paint waste properly contained and stored?',
    'Has any hazardous waste exceeded allowable on-site storage time limits? Specified days allowed:',
    'Was the hazardous waste storage area inspected for cleanliness?',
    'Was any hazardous waste shipped off-site on this date?'
  ]},
  {key:'work', title:'Work Area', sub:'OSHA 1926.20, 1926.21', commentHeader:'Comments', questions:[
    'Is the restricted work area properly segregated with required barriers, caution tape, and signage?',
    'Are employees and authorized personnel within restricted areas utilizing required PPE?',
    'Is the work area free of visible spills or dust accumulation at the end of work inspection?',
    'Are tools tethered where required?',
    'Are extension cords and electrical tools free of damage (no exposed wires or splices), and are GFCIs in use where required?',
    'Are work area walkways maintained free of debris and tripping hazards?',
    'Are any pre-existing conditions observed that require documentation? (If yes, document and photograph.)',
    'Are any other trades or operations working near the work area?'
  ]},
  {key:'life', title:'Life Safety', sub:'', commentHeader:'Comments', questions:[
    'Is required safety equipment (inside and outside containment) readily available and functional?',
    'Are first aid kits, fire extinguishers, eye wash and emergency equipment present and readily accessible?',
    'Are all required project plans (e.g., safety/work plans, waste management, rescue plans) available on site and implemented?',
    'Are independent lifelines and rigging ropes in use, within rated capacity, and in good condition?',
    'Was a daily toolbox talk conducted with crew attendance? If yes Topic:',
    'Were any incidents or accidents reported on this date?',
    'Were any verbal safety warnings issued on this date?'
  ]},
  {key:'testing', title:'Testing', sub:'OSHA 1926.62/AMPP/SSPC QP Standards', commentHeader:'Comments', questions:[
    'Have all workers received medical clearance to wear a respirator and work with lead when applicable (including blood testing, respirator clearance and fit testing)?',
    'Have all workers received annual lead training?',
    'Was any monitoring performed today (e.g., air, wipe, water, soil, waste)? Chain of Custody (if applicable):'
  ]},
  {key:'containment', title:'Containment', sub:'OSHA 1926.57/AMPP/SSPC Guide 6 (Containment)', commentHeader:'Comments', questions:[
    'Is the containment system intact and functioning in accordance with approved plans (are joints sealed? openings closed? floor covering in place? make-up air inlets and airlock access points operational)?',
    'Were dust collectors and vacuum equipment operational throughout blasting activities?',
    'Was adequate airflow/ventilation maintained throughout blasting operations?',
    'Was negative pressure maintained within the containment? Visual/Magnehelic: Reading(if applicable):',
    'Were airflow checks performed as required? Method: Airflow Readings:',
    'Was a final cleanup inspection of the containment performed? Was the containment cleaned per spec?'
  ]}
];
function dsifChoice(name){return `<div class="choiceBtns dsifChoice"><label><input type="radio" name="${name}" value="Yes">Yes</label><label><input type="radio" name="${name}" value="No">No</label><label><input type="radio" name="${name}" value="N/A">N/A</label></div>`;}
function dsifForm(){
  app.innerHTML=`<div class="container printOnly dsifContainer"><h1>Daily Safety Inspection Form</h1>
    <div class="panel"><h2>Project / Report Information</h2><div class="grid three">${projectField('dsifProject','Project')} ${field('dsifReportDate','Report Date','date')} ${field('dsifDay','Day','text','readonly')} ${field('dsifWeather','Weather')} ${selectField('dsifAttachedPages','Attached Pages',['','Accident Report','Incident Report','Safety Violation','Accident Report + Incident Report','Accident Report + Safety Violation','Incident Report + Safety Violation'])}</div></div>
    ${DSIF_SECTIONS.map((sec,si)=>`<div class="panel dsifSection"><h2>${sec.title}</h2>${sec.sub?`<p class="tiny"><b>${sec.sub}</b></p>`:''}${sec.questions.map((q,qi)=>`<div class="checkrow"><div class="questionTitle">${q}</div>${dsifChoice('dsif_'+si+'_'+qi)}<label>Comments / Corrections</label><textarea id="dsifComment_${si}_${qi}" placeholder="Not applicable for today, notes, readings, etc."></textarea></div>`).join('')}</div>`).join('')}
    <div class="panel"><h2>Visible Emissions / Signature</h2><div class="grid four">${field('dsifVELocation','Visible Emissions Location')} ${field('dsifVETime','Time')} ${field('dsifVEObservation','Observation Period')} ${field('dsifVEEmission','Emission Time')}</div>${textarea('dsifCorrections','Comments / Corrections')}${field('dsifCompetentPerson','Competent Person (Print Name)')}${sigField('dsifSignature','Signature')}<div class="actions"><button class="btn" id="dsifPrintBtn" type="button">Save PDF / Print DSIF</button></div>${printPdfHelp('dsif')}<div id="dsifMsg"></div></div>
  </div>`;
  setupOtherProject('dsifProject');
  const dateEl=document.getElementById('dsifReportDate'); const dayEl=document.getElementById('dsifDay');
  const updateDay=()=>{ if(!dateEl.value){dayEl.value='';return;} const d=new Date(dateEl.value+'T00:00:00'); dayEl.value=d.toLocaleDateString(undefined,{weekday:'long'}) + ' (Day)'; };
  dateEl.value=new Date().toISOString().slice(0,10); updateDay(); dateEl.addEventListener('change',updateDay);
  initSignatureButtons();
  document.getElementById('dsifPrintBtn').onclick=(e)=>{e.preventDefault(); try{const data=collectDsif(); document.title=formSaveTitle('dsif', data.reportDate, data.project); buildDsifPrint(data); openPrintNow('dsifMsg');}catch(err){document.getElementById('dsifMsg').innerHTML=`<div class="notice">Print preview could not open: ${esc(err.message)}.</div>`; console.error(err);}};
}
function collectDsif(){
  return {project:projectValue('dsifProject'),reportDate:val('dsifReportDate'),day:val('dsifDay'),weather:val('dsifWeather'),attachedPages:val('dsifAttachedPages'),competentPerson:val('dsifCompetentPerson'),signature:val('dsifSignature'),signatureData:signatureStore.dsifSignature||'',visible:{location:val('dsifVELocation'),time:val('dsifVETime'),observation:val('dsifVEObservation'),emission:val('dsifVEEmission')},corrections:val('dsifCorrections'),sections:DSIF_SECTIONS.map((sec,si)=>({title:sec.title,sub:sec.sub,commentHeader:sec.commentHeader,questions:sec.questions.map((q,qi)=>({q,status:checked('dsif_'+si+'_'+qi),comment:val('dsifComment_'+si+'_'+qi)}))}))};
}
function markCell(status, want){return status===want ? 'X' : '';}
function dsifSectionPrint(sec){
  return `<table class="dsifTable"><tr><th class="dsifSec" colspan="1">${esc(sec.title)}${sec.sub?`<br><span>${esc(sec.sub)}</span>`:''}</th><th>Yes</th><th>No</th><th>${esc(sec.commentHeader||'Comments')}</th></tr>${sec.questions.map(item=>`<tr><td>${esc(item.q)}</td><td class="mark">${markCell(item.status,'Yes')}</td><td class="mark">${markCell(item.status,'No')}</td><td>${esc(item.comment)}</td></tr>`).join('')}</table>`;
}
function buildDsifPrint(data=collectDsif()){
  const dateSlash=dateToSlashYYYY(data.reportDate); const page1=data.sections.slice(0,4); const page2=data.sections.slice(4);
  const header=`<div class="dsifHeader"><div class="dsifTitle"><b>Daily Safety Inspection Form</b></div><div class="dsifLogo"><img src="${logo}"><span>Revision - 2</span></div><div><b>Project:</b> <span>${esc(data.project)}</span></div><div><b>Report Date:</b> <span>${esc(dateSlash)}</span></div><div><b>Day:</b> <span>${esc(data.day)}</span></div><div><b>Weather:</b> <span>${esc(data.weather)}</span></div><div><b>Attached Pages:</b> <span>${esc(data.attachedPages)}</span></div></div>`;
  const sheet1=`<div class="dsifSheet">${header}${page1.map(dsifSectionPrint).join('')}<div class="dsifFoot"><span>DSIF B/P</span><span>Revision - 0</span></div></div>`;
  const visible=`<table class="dsifVisible"><tr><th rowspan="3">Visible Emissions</th><th>Locations</th><th>Time</th><th>Observation<br>Period</th><th>Emission Time</th></tr><tr><td>${esc(data.visible.location||'Not applicable for today')}</td><td>${esc(data.visible.time)}</td><td>${esc(data.visible.observation)}</td><td>${esc(data.visible.emission)}</td></tr><tr><th colspan="4">Comments/Corrections</th></tr><tr><td colspan="5">${esc(data.corrections)}</td></tr></table>`;
  const sheet2=`<div class="dsifSheet">${page2.map(dsifSectionPrint).join('')}${visible}<div class="dsifSign"><div><b>Competent Person (Print Name)</b> ${esc(data.competentPerson)}</div><div><b>Signature:</b> ${sigPrint(data.signatureData,data.signature)}</div></div><div class="dsifFoot"><span>DSIF B/P</span><span>Revision - 2</span></div></div>`;
  setPrint(sheet1+sheet2); return sheet1+sheet2;
}


const WEEKLY_TOPICS = [
  '1. Safety culture: stop-work authority & reporting (OSHA: 29 CFR 1926.20, 1926.21)',
  '2. Pre-job safety meeting & job hazard analysis (OSHA: 29 CFR 1926.20, 1926.21)',
  '3. Daily/weekly inspections & documentation habits (OSHA: 29 CFR 1926.20(b), 1910.132(d))',
  '4. PPE fundamentals: selection, limitations, and training (OSHA: 29 CFR 1926 Subpart E, 1910.132)',
  '5. Head, eye, and face protection (OSHA: 29 CFR 1926.100, 1926.102; 1910.133)',
  '6. Hand protection & chemical glove selection (OSHA: 29 CFR 1910.138, 1926.95)',
  '7. Foot protection, work clothing, and skin exposure control (OSHA: 29 CFR 1926.96, 1926.28; 1910.132)',
  '8. Hearing conservation & noise control (OSHA: 29 CFR 1926.52, 1910.95)',
  '9. Respiratory protection overview & medical clearance (OSHA: 29 CFR 1910.134; 1926.103)',
  '10. Fit testing & facial hair/fit issues (OSHA: 29 CFR 1910.134(f), (g))',
  '11. User seal checks, cleaning, storage, and respirator inspections (OSHA: 29 CFR 1910.134 App B-1/B-2, (h))',
  '12. Hazard communication: labels, SDS, and chemical inventory (OSHA: 29 CFR 1910.1200; 1926.59)',
  '13. Chemical storage, mixing, and spill prevention (OSHA: 29 CFR 1910.1200, 1910.106; 1926.152)',
  '14. Flammable liquids & ignition control during painting operations (OSHA: 29 CFR 1910.106; 1926.152)',
  '15. Fire prevention, hot work, and extinguishers (PASS) (OSHA: 29 CFR 1926 Subpart F; 1910.157)',
  '16. Housekeeping & slip/trip/fall prevention (OSHA: 29 CFR 1926.25; 1910.22)',
  '17. Ladder safety: selection, inspection, and setup (OSHA: 29 CFR 1926 Subpart X; 1910.23)',
  '18. Scaffold safety: competent person, access, and daily inspections (OSHA: 29 CFR 1926 Subpart L)',
  '19. Scaffold platforms & falling-object protection (OSHA: 29 CFR 1926.451(g), (h))',
  '20. Fall protection fundamentals: 6-foot rule and beyond (OSHA: 29 CFR 1926 Subpart M)',
  '21. Harness use, inspection, and 100% tie-off practices (OSHA: 29 CFR 1926.502(d))',
  '22. Fall rescue planning & suspension trauma awareness (OSHA: 29 CFR 1926.502(d)(20))',
  '23. Aerial lifts: inspection, operation, and tie-off (OSHA: 29 CFR 1926.453; 1910.67)',
  '24. Electrical safety: GFCI, cords, lighting, and temporary power (OSHA: 29 CFR 1926 Subpart K)',
  '25. Lockout/Tagout & control of hazardous energy (OSHA: 29 CFR 1910.147; 1926.417)',
  '26. Hand & power tool safety (OSHA: 29 CFR 1926 Subpart I)',
  '27. High-pressure hoses, whip checks, and injection hazards (OSHA: 29 CFR 1926.302(b))',
  '28. Compressed air: safe blow-down and alternatives (OSHA: 29 CFR 1910.242(b))',
  '29. Abrasive blasting SOP & required PPE (OSHA: 29 CFR 1926.57; 1910.94(a))',
  '30. Blasting ventilation, airflow checks, and negative pressure (OSHA: 29 CFR 1926.57)',
  '31. Containment integrity, dust control, and HEPA housekeeping (OSHA: 29 CFR 1926.57; 1926.62)',
  '32. Regulated areas, signs, and access control (OSHA: 29 CFR 1926.62(e))',
  '33. Lead awareness: hazards, symptoms, and hygiene rules (OSHA: 29 CFR 1926.62)',
  '34. Lead controls: exposure assessment and medical surveillance (OSHA: 29 CFR 1926.62)',
  '35. Decontamination: change areas, showers, and cleaning logs (OSHA: 29 CFR 1926.62(j))',
  '36. Personal hygiene: handwashing, break areas, and prohibited items (OSHA: 29 CFR 1926.62(j))',
  '37. Confined space basics: identification and hazards (OSHA: 29 CFR 1910.146)',
  '38. Confined space permits & roles (OSHA: 29 CFR 1910.146)',
  '39. Atmospheric testing & ventilation for confined spaces (OSHA: 29 CFR 1910.146(d)(5))',
  '40. Confined space rescue & retrieval systems (OSHA: 29 CFR 1910.146(k))',
  '41. Ergonomics & material handling (OSH Act General Duty Clause; 29 CFR 1926.250)',
  '42. Rigging & hoisting basics (OSHA: 29 CFR 1926.251)',
  '43. Crane safety: signaling, swing radius, and power lines (OSHA: 29 CFR 1926 Subpart CC)',
  '44. Forklift safety & load handling (OSHA: 29 CFR 1910.178; 1926.602)',
  '45. Line-of-fire awareness & working around mobile equipment (OSHA: 29 CFR 1926.600, 1926.602; 1926.21)',
  '46. Temporary traffic control & flagging fundamentals (OSHA: 29 CFR 1926.200–1926.203)',
  '47. Railroad safety & working near tracks/third rail (OSH Act General Duty Clause; 29 CFR 1926.21)',
  '48. Environmental controls: hazardous waste, decon water, and site boundaries (OSHA: 29 CFR 1910.120; 1926.65; 1910.1200)',
  '49. Emergency action plan: communications and muster (OSHA: 29 CFR 1926.35; 1910.38)',
  '50. First aid, eyewash, and chemical exposure response (OSHA: 29 CFR 1926.50; 1910.151)',
  '51. Incident/near-miss reporting, investigation, and root cause (OSHA: 29 CFR 1904.39; 1926.20)'
];
let weeklyPollTimer = null;

function weeklySafetyTopicValue(){
  const topicEl = document.getElementById('weeklyTopic');
  if(!topicEl) return '';
  return topicEl.value === '__custom__' ? val('weeklyCustomTopic') : topicEl.value.trim();
}

function setupWeeklyCustomTopic(){
  const topicEl = document.getElementById('weeklyTopic');
  const customEl = document.getElementById('weeklyCustomTopic');
  if(!topicEl || !customEl) return;
  const sync = () => {
    const custom = topicEl.value === '__custom__';
    customEl.style.display = custom ? 'block' : 'none';
    if(custom) customEl.focus();
  };
  topicEl.addEventListener('change', sync);
  sync();
}

function weeklySafetyForm(){
  if(weeklyPollTimer) { clearInterval(weeklyPollTimer); weeklyPollTimer = null; }
  app.innerHTML = `<div class="container weeklyContainer"><h1>Weekly Safety Meeting</h1>
    <div class="panel"><h2>Start Meeting</h2><div class="grid two">${projectField('weeklyProject','Project')} ${field('weeklyDate','Meeting Date','date')} ${field('weeklyForeman','Foreman / Field Person')} <div><label for="weeklyTopic">Safety Topic (one per meeting)</label><select id="weeklyTopic"><option value=""></option><option value="__custom__">Custom Topic</option>${WEEKLY_TOPICS.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select><input id="weeklyCustomTopic" class="projectOther" type="text" placeholder="Type custom toolbox talk topic" style="display:none;margin-top:8px"></div></div>
    <div class="actions"><button class="btn light" id="weeklyRandomTopicBtn" type="button">Randomize Topic</button><button class="btn" id="weeklyStartBtn" type="button">Start Meeting</button></div><p class="tiny">Tap Randomize Topic to pick from the loaded safety topic list, or choose Custom Topic and type your own.</p><div id="weeklyMsg"></div></div>
    <div id="weeklyLive" class="panel weeklyLive" style="display:none"></div>
  </div>`;
  setupOtherProject('weeklyProject');
  setupWeeklyCustomTopic();
  document.getElementById('weeklyDate').value = new Date().toISOString().slice(0,10);
  const topicEl = document.getElementById('weeklyTopic');
  const customEl = document.getElementById('weeklyCustomTopic');
  const randomBtn = document.getElementById('weeklyRandomTopicBtn');
  randomBtn.onclick = () => {
    if(!WEEKLY_TOPICS.length) return;
    const current = weeklySafetyTopicValue();
    let picked = current;
    for(let i=0; i<8 && picked===current && WEEKLY_TOPICS.length>1; i++){
      picked = WEEKLY_TOPICS[Math.floor(Math.random()*WEEKLY_TOPICS.length)];
    }
    if(picked===current) picked = WEEKLY_TOPICS[Math.floor(Math.random()*WEEKLY_TOPICS.length)];
    topicEl.value = picked;
    if(customEl) customEl.value = '';
    setupWeeklyCustomTopic();
    randomBtn.textContent = 'Pick Another Topic';
    document.getElementById('weeklyMsg').innerHTML = '';
  };
  document.getElementById('weeklyStartBtn').onclick = startWeeklyMeeting;
}

async function startWeeklyMeeting(){
  const payload = { project: projectValue('weeklyProject'), date: val('weeklyDate'), foreman: val('weeklyForeman'), topic: weeklySafetyTopicValue() };
  if(!payload.project || !payload.date || !payload.topic){ document.getElementById('weeklyMsg').innerHTML='<div class="notice">Project, meeting date, and safety topic are required.</div>'; return; }
  const res = await fetch('/api/weekly-meetings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const json = await res.json();
  if(!res.ok){ document.getElementById('weeklyMsg').innerHTML=`<div class="notice">${esc(json.error||'Could not start meeting.')}</div>`; return; }
  renderWeeklyLive(json.meeting);
}

function weeklySignUrl(id){ return `${location.origin}/#/weekly-sign/${encodeURIComponent(id)}`; }
function weeklyQrUrl(id){ return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(weeklySignUrl(id))}`; }
function weeklyTitle(data){ const project=fileProjectName(data.project); const date=dateToDotMMDDYY(data.date)||'No.Date'; return project ? `Weekly_Safety_Meeting_${date}_${project}` : `Weekly_Safety_Meeting_${date}`; }

function renderWeeklyLive(meeting){
  const live=document.getElementById('weeklyLive');
  if(!live) return;
  const link=weeklySignUrl(meeting.id);
  live.style.display='block';
  live.innerHTML = `<h2>Live Sign-In</h2><div class="weeklyLiveGrid"><div><div class="qrCard"><img src="${weeklyQrUrl(meeting.id)}" alt="QR code for worker sign-in"><p class="tiny">Workers scan this QR code with their phones.</p></div><input class="copyLink" value="${esc(link)}" readonly><div class="actions"><button class="btn light" id="weeklyCopyBtn" type="button">Copy Sign-In Link</button><button class="btn" id="weeklyPrintBtn" type="button">Save PDF / Print Meeting</button></div></div><div><h3>Workers Signed In: <span id="weeklyCount">0</span></h3><div id="weeklyAttendees" class="attendeeList">Waiting for workers to sign in...</div></div></div>`;
  document.getElementById('weeklyCopyBtn').onclick=()=>navigator.clipboard?.writeText(link);
  document.getElementById('weeklyPrintBtn').onclick=async()=>{ const latest=await fetchWeeklyMeeting(meeting.id); document.title=weeklyTitle(latest); buildWeeklyPrint(latest); openPrintNow(); };
  pollWeekly(meeting.id);
  weeklyPollTimer = setInterval(()=>pollWeekly(meeting.id),3000);
}
async function fetchWeeklyMeeting(id){ const res=await fetch(`/api/weekly-meetings/${encodeURIComponent(id)}`); const json=await res.json(); if(!res.ok) throw new Error(json.error||'Meeting not found'); return json.meeting; }
async function pollWeekly(id){
  try{ const meeting=await fetchWeeklyMeeting(id); const box=document.getElementById('weeklyAttendees'), count=document.getElementById('weeklyCount'); if(!box) return; const rows=meeting.attendees||[]; if(count) count.textContent=rows.length; box.innerHTML = rows.length ? rows.map((a,i)=>`<div class="attendeeRow"><b>${i+1}. ${esc(a.name)}</b>${a.company?`<span>${esc(a.company)}</span>`:''}${a.signatureData?`<span class="signedBadge">Signature captured</span>`:''}<small>${new Date(a.signedAt).toLocaleTimeString()}</small></div>`).join('') : 'Waiting for workers to sign in...'; }catch(e){ console.error(e); }
}

async function weeklySignForm(id){
  if(weeklyPollTimer) { clearInterval(weeklyPollTimer); weeklyPollTimer = null; }
  let meeting;
  try{ meeting=await fetchWeeklyMeeting(id); }catch(e){ app.innerHTML=`<div class="container"><div class="panel"><h1>Meeting Not Found</h1><p>${esc(e.message)}</p></div></div>`; return; }
  signatureStore.workerSignature = '';
  app.innerHTML=`<div class="container workerSign"><div class="panel"><img src="${logo}" class="smallLogo"><h1>Weekly Safety Meeting Sign-In</h1><p><b>Project:</b> ${esc(meeting.project)}</p><p><b>Date:</b> ${esc(dateToSlashYYYY(meeting.date))}</p><p><b>Topic:</b> ${esc(meeting.topic)}</p><div class="grid one">${field('workerName','Print Name')} ${field('workerCompany','Company','text','value="JAGD Construction"')}</div>${sigField('workerSignature','Signature')}<p class="tiny">Print your name, tap the signature box, sign with your finger, then press Sign In.</p><div class="actions"><button class="btn" id="workerSignBtn" type="button">Sign In</button></div><div id="workerSignMsg"></div></div></div>`;
  initSignatureButtons();
  document.getElementById('workerSignBtn').onclick=async()=>{
    const name=val('workerName'); const company=val('workerCompany'); const signatureData=signatureStore.workerSignature||'';
    if(!name){document.getElementById('workerSignMsg').innerHTML='<div class="notice">Print your name to sign in.</div>'; return;}
    if(!signatureData){document.getElementById('workerSignMsg').innerHTML='<div class="notice">Tap the signature box and sign with your finger.</div>'; return;}
    const res=await fetch(`/api/weekly-meetings/${encodeURIComponent(id)}/sign`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,company,signatureData})});
    const json=await res.json();
    if(!res.ok){document.getElementById('workerSignMsg').innerHTML=`<div class="notice">${esc(json.error||'Could not sign in.')}</div>`;return;}
    document.getElementById('workerSignMsg').innerHTML='<div class="notice success">You are signed in. You can close this page.</div>';
    document.getElementById('workerSignBtn').disabled=true;
  };
}

function buildWeeklyPrint(meeting){
  const rows=(meeting.attendees||[]).map((a,i)=>`<tr><td>${i+1}</td><td>${esc(a.name)}</td><td>${esc(a.company||'')}</td><td>${esc(new Date(a.signedAt).toLocaleString())}</td><td>${a.signatureData?`<img class="weeklySigPrint" src="${a.signatureData}">`:''}</td></tr>`).join('');
  const blanks=Array.from({length:Math.max(8,18-(meeting.attendees||[]).length)},(_,i)=>`<tr><td>${(meeting.attendees||[]).length+i+1}</td><td></td><td></td><td></td><td></td></tr>`).join('');
  const html=`<div class="weeklySheet"><div class="weeklyPrintHeader"><img src="${logo}"><div><h1>Weekly Safety Meeting</h1><p><b>Project:</b> ${esc(meeting.project)}</p><p><b>Meeting Date:</b> ${esc(dateToSlashYYYY(meeting.date))}</p><p><b>Foreman:</b> ${esc(meeting.foreman||'')}</p></div></div><div class="topicBox"><b>Safety Topic:</b><br>${esc(meeting.topic)}</div><table class="weeklyTable"><tr><th>#</th><th>Worker Name</th><th>Company</th><th>Signed In</th><th>Signature / Initials</th></tr>${rows}${blanks}</table><div class="weeklyFoot">Weekly Safety Meeting</div></div>`;
  setPrint(html); return html;
}


async function loadActiveWorkers(){
  if(activeWorkers.length) return activeWorkers;
  activeWorkers = Array.isArray(EMBEDDED_ACTIVE_WORKERS) ? EMBEDDED_ACTIVE_WORKERS.slice() : [];
  try{
    const res = await fetch('/data/active-workers.json?v=20260613v24', {cache:'no-store'});
    if(res.ok){
      const json = await res.json();
      if(Array.isArray(json) && json.length) activeWorkers = json;
    }
  }catch(e){ console.warn('Using embedded worker list fallback', e); }
  return activeWorkers;
}

function cleanWorkerLocal(v){ return String(v||'').replace(/\.0$/,''); }
function workerDisplayName(w){ return String(w.fullName || `${w.firstName||''} ${w.lastName||''}`.trim()).trim(); }
function workerSearchText(w){ return `${workerDisplayName(w)} ${w.firstName||''} ${w.lastName||''} ${w.class||''} ${w.local||''}`.toLowerCase().replace(/[^a-z0-9 ]+/g,' '); }
function findWorkerByName(name){
  const n=String(name||'').trim().toLowerCase();
  if(!n) return null;
  return activeWorkers.find(w=>String(w.fullName||'').trim().toLowerCase()===n) || activeWorkers.find(w=>`${w.firstName||''} ${w.lastName||''}`.trim().toLowerCase()===n) || null;
}

function dwlDataList(id, options){
  return `<datalist id="${id}">${options.map(o=>`<option value="${esc(o)}"></option>`).join('')}</datalist>`;
}
function normalizeDwlClass(c){
  const v=String(c||'').trim(); const l=v.toLowerCase();
  if(!v) return '';
  if(l==='jm' || l.includes('journey')) return 'JM';
  if(l==='fm' || l.includes('foreman')) return 'FM';
  if(l==='qc' || l.includes('quality')) return 'QC';
  if(l.includes('steward')) return 'Steward';
  if(l.includes('1')) return '1st';
  if(l.includes('2')) return '2nd';
  if(l.includes('3')) return '3rd';
  if(l.includes('4')) return '4th';
  return v;
}
function cleanDwlLocal(v){
  const s=cleanWorkerLocal(v);
  return s.replace(/\.0$/,'');
}

function dwlRow(i){
  return `<tr data-row="${i}"><td class="dwlNum">${i}</td><td class="dwlEmpCell"><input id="dwlEmp${i}" class="dwlEmpInput" autocomplete="off" autocapitalize="words" spellcheck="false"><div id="dwlSuggest${i}" class="dwlSuggest"></div></td><td><input id="dwlLoc${i}"></td><td><input id="dwlAct${i}" list="dwlActivityList" inputmode="numeric"></td><td><input id="dwlClass${i}" list="dwlClassList" autocapitalize="characters"></td><td><input id="dwlLocal${i}" list="dwlLocalList" inputmode="numeric"></td><td><input id="dwlStraight${i}" class="dwlStraightBox" inputmode="decimal" title="Tap to set 8 hours; edit if needed"></td><td><input id="dwlOver${i}" list="dwlOverList" inputmode="decimal"></td><td class="center"><input id="dwlNoLunch${i}" class="dwlNoLunchBox" readonly inputmode="decimal" title="Tap to toggle .5"></td><td><input id="dwlPT${i}" list="dwlSmallHourList" inputmode="decimal"></td><td><input id="dwlRT${i}" list="dwlSmallHourList" inputmode="decimal"></td></tr>`;
}
function applyWorkerToDwlRow(i,w){
  if(!w) return;
  const emp=document.getElementById('dwlEmp'+i);
  if(emp) emp.value = workerDisplayName(w);
  const cls=document.getElementById('dwlClass'+i); if(cls) cls.value = normalizeDwlClass(w.class || '');
  const loc=document.getElementById('dwlLocal'+i); if(loc) loc.value = cleanDwlLocal(w.local);
}
function getDwlSuggestBox(i){
  return document.getElementById('dwlSuggest'+i);
}
function hideDwlSuggestions(){
  document.querySelectorAll('.dwlSuggest').forEach(box=>{
    box.style.display='none';
    box.innerHTML='';
  });
}
function showDwlSuggestions(i){
  const emp=document.getElementById('dwlEmp'+i), box=getDwlSuggestBox(i);
  if(!emp || !box) return;
  const q=emp.value.toLowerCase().trim();
  if(q.length<1){ hideDwlSuggestions(); return; }
  const matches=dwlMatchesForQuery(q).slice(0,7);
  if(!matches.length){ hideDwlSuggestions(); return; }
  document.querySelectorAll('.dwlSuggest').forEach(other=>{
    if(other!==box){ other.style.display='none'; other.innerHTML=''; }
  });
  box.innerHTML=matches.map((w,idx)=>`<button type="button" data-idx="${idx}"><b>${esc(workerDisplayName(w))}</b>${(w.class||w.local)?`<span>${esc(w.class||'')}${w.local?` • Local ${esc(cleanWorkerLocal(w.local))}`:''}</span>`:''}</button>`).join('');
  box.style.display='block';
  box.querySelectorAll('button').forEach(btn=>{
    btn.onmousedown=(e)=>{
      e.preventDefault();
      const idx=Number(btn.dataset.idx);
      applyWorkerToDwlRow(i,matches[idx]);
      hideDwlSuggestions();
      const next=document.getElementById('dwlLoc'+i);
      if(next) next.focus();
    };
    btn.onclick=(e)=>{
      e.preventDefault();
      const idx=Number(btn.dataset.idx);
      applyWorkerToDwlRow(i,matches[idx]);
      hideDwlSuggestions();
    };
  });
}

function populateDwlWorkerDatalist(){
  const dl=document.getElementById('dwlWorkerList');
  if(!dl) return;
  dl.innerHTML = activeWorkers.map(w=>`<option value="${esc(workerDisplayName(w))}">${esc(w.class||'')}${w.local?` Local ${esc(cleanWorkerLocal(w.local))}`:''}</option>`).join('');
}
function dwlMatchesForQuery(q){
  const raw=String(q||'').trim().toLowerCase();
  const clean=raw.replace(/[^a-z0-9 ]+/g,' ');
  if(!clean) return [];
  const starts=[]; const contains=[];
  activeWorkers.forEach(w=>{
    const name=workerDisplayName(w).toLowerCase();
    const first=String(w.firstName||'').toLowerCase();
    const last=String(w.lastName||'').toLowerCase();
    const hay=workerSearchText(w);
    if(name.startsWith(raw) || first.startsWith(raw) || last.startsWith(raw)) starts.push(w);
    else if(hay.includes(clean)) contains.push(w);
  });
  return starts.concat(contains).slice(0,15);
}

function setupDwlWorkerAutofill(){
  for(let i=1;i<=80;i++){
    const emp=document.getElementById('dwlEmp'+i);
    if(!emp || emp.dataset.ready==='1') continue;
    emp.dataset.ready='1';
    emp.addEventListener('input',()=>showDwlSuggestions(i));
    emp.addEventListener('keyup',()=>showDwlSuggestions(i));
    emp.addEventListener('focus',()=>showDwlSuggestions(i));
    emp.addEventListener('change',()=>{ const w=findWorkerByName(emp.value); if(w) applyWorkerToDwlRow(i,w); });
    emp.addEventListener('blur',()=>{ setTimeout(()=>hideDwlSuggestions(),220); setTimeout(()=>saveDwlLastCrewFromRows(),250); });
    const st=document.getElementById('dwlStraight'+i);
    if(st && st.dataset.ready!=='1'){
      st.dataset.ready='1';
      st.addEventListener('click',()=>{ if(!st.value.trim()){ st.value='8'; setTimeout(()=>{ try{ st.select(); }catch(e){} },0); } });
      st.addEventListener('input',()=>{ const n=parseFloat(st.value); if(!isNaN(n) && n>8) st.value='8'; });
    }
    const nl=document.getElementById('dwlNoLunch'+i);
    if(nl && nl.dataset.ready!=='1'){
      nl.dataset.ready='1';
      nl.addEventListener('click',()=>{ nl.value = nl.value.trim()==='.5' ? '' : '.5'; });
    }
  }
}
function setupDwlRows(){
  const tbody=document.getElementById('dwlRows');
  tbody.innerHTML = Array.from({length:20},(_,idx)=>dwlRow(idx+1)).join('');
  setupDwlWorkerAutofill();
}
function addDwlPageRows(){
  const tbody=document.getElementById('dwlRows');
  const current=tbody.querySelectorAll('tr').length;
  if(current>=40) return;
  tbody.insertAdjacentHTML('beforeend', Array.from({length:20},(_,idx)=>dwlRow(current+idx+1)).join(''));
  setupDwlWorkerAutofill();
}

function clearDwlWorkerRows(){
  for(let i=1;i<=80;i++){
    ['Emp','Loc','Act','Class','Local','Straight','Over','NoLunch','PT','RT'].forEach(k=>{
      const el=document.getElementById('dwl'+k+i);
      if(el) el.value='';
    });
  }
}
function normalizeCrewName(v){
  return String(v||'').trim().replace(/\s+/g,' ');
}
function findWorkerForCrewName(name){
  const raw=normalizeCrewName(name);
  if(!raw) return null;
  const exact=findWorkerByName(raw);
  if(exact) return exact;
  const lower=raw.toLowerCase();
  const flipped=lower.includes(',') ? lower.split(',').map(x=>x.trim()).reverse().join(' ') : '';
  const clean=lower.replace(/[^a-z0-9]+/g,' ').trim();
  const matches=activeWorkers.filter(w=>{
    const full=workerDisplayName(w).toLowerCase();
    const first=String(w.firstName||'').toLowerCase();
    const last=String(w.lastName||'').toLowerCase();
    const fullClean=full.replace(/[^a-z0-9]+/g,' ').trim();
    return full===lower || full===flipped || fullClean===clean || `${first} ${last}`.trim()===lower || `${last} ${first}`.trim()===lower;
  });
  if(matches.length===1) return matches[0];
  const starts=dwlMatchesForQuery(raw).filter(w=>workerDisplayName(w).toLowerCase().startsWith(lower));
  return starts.length===1 ? starts[0] : null;
}
function getDwlCrewNamesFromRows(){
  const names=[];
  for(let i=1;i<=80;i++){
    const emp=document.getElementById('dwlEmp'+i);
    if(emp && emp.value.trim()) names.push(emp.value.trim());
  }
  return names;
}
function saveDwlLastCrewFromRows(){
  try{
    const names=getDwlCrewNamesFromRows();
    if(names.length) localStorage.setItem('jagdDwlLastCrewNames', JSON.stringify(names));
  }catch(e){}
}
function ensureDwlRows(count){
  const tbody=document.getElementById('dwlRows');
  if(!tbody) return;
  while(tbody.querySelectorAll('tr').length<count && tbody.querySelectorAll('tr').length<40) addDwlPageRows();
}
function applyDwlCrewNames(names){
  const cleanNames=(names||[]).map(normalizeCrewName).filter(Boolean);
  if(!cleanNames.length){
    const msg=document.getElementById('dwlMsg');
    if(msg) msg.innerHTML='<div class="notice">Paste at least one employee name.</div>';
    return;
  }
  ensureDwlRows(cleanNames.length);
  clearDwlWorkerRows();
  cleanNames.slice(0,40).forEach((name,idx)=>{
    const row=idx+1;
    const worker=findWorkerForCrewName(name);
    if(worker) applyWorkerToDwlRow(row, worker);
    else {
      const emp=document.getElementById('dwlEmp'+row);
      if(emp) emp.value=name;
    }
  });
  try{ localStorage.setItem('jagdDwlLastCrewNames', JSON.stringify(cleanNames.slice(0,40))); }catch(e){}
  const msg=document.getElementById('dwlMsg');
  if(msg) msg.innerHTML=`<div class="notice success">Loaded ${Math.min(cleanNames.length,40)} crew member${cleanNames.length===1?'':'s'}.${cleanNames.length>40?' Only the first 40 fit right now.':''}</div>`;
}
function showDwlCrewUpload(){
  document.querySelectorAll('.modalOverlay').forEach(m=>m.remove());
  const modal=document.createElement('div');
  modal.className='modalOverlay no-print';
  modal.innerHTML=`<div class="modalBox crewUploadBox"><h2>Upload Crew</h2><p class="tiny">Paste one employee name per line. Matching workers will auto-fill Class and Local. Unknown names will still load as manual entries.</p><textarea id="dwlCrewPaste" placeholder="One name per line"></textarea><div class="actions right"><button class="btn light" type="button" id="dwlCrewCancel">Cancel</button><button class="btn" type="button" id="dwlCrewApply">Apply</button></div></div>`;
  document.body.appendChild(modal);
  const ta=document.getElementById('dwlCrewPaste');
  setTimeout(()=>ta&&ta.focus(),50);
  document.getElementById('dwlCrewCancel').onclick=()=>modal.remove();
  modal.addEventListener('click',e=>{ if(e.target===modal) modal.remove(); });
  document.getElementById('dwlCrewApply').onclick=()=>{
    const names=String(ta.value||'').split(/\r?\n/).map(normalizeCrewName).filter(Boolean);
    applyDwlCrewNames(names);
    modal.remove();
  };
}
function loadDwlLastCrew(){
  let names=[];
  try{ names=JSON.parse(localStorage.getItem('jagdDwlLastCrewNames')||'[]'); }catch(e){ names=[]; }
  if(!Array.isArray(names) || !names.length){
    const msg=document.getElementById('dwlMsg');
    if(msg) msg.innerHTML='<div class="notice">No last crew saved on this phone/browser yet. Use Upload Crew first.</div>';
    return;
  }
  applyDwlCrewNames(names);
}
function resetDwlForm(){
  if(!confirm('Reset this Daily Work Log? This clears the form on this screen.')) return;
  ['dwlProject','dwlProjectOther','dwlCrew','dwlCrewOther','dwlWeather','dwlForeman','dwlDescription','dwlNotes','dwlSafetyTopic','dwlPrintName'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
  signatureStore.dwlSignature='';
  const sig=document.getElementById('dwlSignaturePreview'); if(sig) sig.innerHTML='Tap to sign';
  const dateEl=document.getElementById('dwlReportDate'), dayEl=document.getElementById('dwlDay');
  if(dateEl){ dateEl.value=new Date().toISOString().slice(0,10); const d=new Date(dateEl.value+'T00:00:00'); if(dayEl) dayEl.value=d.toLocaleDateString(undefined,{weekday:'long'}); }
  clearDwlWorkerRows();
  const msg=document.getElementById('dwlMsg');
  if(msg) msg.innerHTML='<div class="notice success">DWL reset.</div>';
}
function activityCodesTable(){
  const rows=[]; for(let i=0;i<DWL_ACTIVITIES.length;i+=2){rows.push(`<tr><td>${esc(DWL_ACTIVITIES[i]||'')}</td><td>${esc(DWL_ACTIVITIES[i+1]||'')}</td></tr>`)}
  return rows.join('');
}
async function autoFillWeather(){
  const weatherEl=document.getElementById('dwlWeather');
  if(!weatherEl || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const {latitude, longitude}=pos.coords;
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
      const res=await fetch(url); const data=await res.json(); const c=data.current||{};
      const code=Number(c.weather_code); const desc = code===0?'Clear':([1,2,3].includes(code)?'Partly cloudy':([45,48].includes(code)?'Fog':([51,53,55,61,63,65,80,81,82].includes(code)?'Rain':([71,73,75,77,85,86].includes(code)?'Snow':([95,96,99].includes(code)?'Thunderstorm':'Cloudy')))));
      if(!weatherEl.value.trim()) weatherEl.value = `${desc}, ${Math.round(c.temperature_2m)}°F, Wind ${Math.round(c.wind_speed_10m||0)} mph`;
    }catch(e){ /* silent: field remains manually editable */ }
  }, ()=>{}, {enableHighAccuracy:false, timeout:8000, maximumAge:600000});
}
async function dwlForm(){
  await loadActiveWorkers();
  app.innerHTML=`<div class="container printOnly dwlContainer"><h1>Daily Work Log</h1><datalist id="dwlWorkerList"></datalist>${dwlDataList('dwlClassList',DWL_CLASS_OPTIONS)}${dwlDataList('dwlLocalList',DWL_LOCAL_OPTIONS)}${dwlDataList('dwlActivityList',DWL_ACTIVITY_NUMBERS)}${dwlDataList('dwlOverList',DWL_OVER_OPTIONS)}${dwlDataList('dwlSmallHourList',DWL_SMALL_HOUR_OPTIONS)}
    <div class="panel dwlBossPanel"><h2>Project / Report Information</h2><div class="grid three dwlTopGrid">${projectField('dwlProject','Project')} ${field('dwlReportDate','Report Date','date')} ${field('dwlDay','Day','text','readonly')} ${crewField('dwlCrew','Crew')} ${field('dwlWeather','Weather')} ${field('dwlForeman','Foreman / Field Person')}</div></div>
    <div class="panel dwlActivitiesPanel"><h2>Activities Performed</h2><table class="dwlActivityInfo"><tbody>${activityCodesTable()}</tbody></table></div>
    <div class="panel"><h2>Work Performed</h2>${textarea('dwlDescription','Location / Description of Work')}${textarea('dwlNotes','Additional Notes')}${textarea('dwlSafetyTopic','Safety Huddle Topic')}</div>
    <div class="panel dwlBossPanel"><h2>Crew / Employees</h2><div class="dwlCrewTools"><div><b>Crew Tools</b><span>Upload a pasted crew list or reload the last crew saved on this phone.</span></div><div class="actions"><button class="btn light" type="button" id="dwlUploadCrewBtn">Upload Crew</button><button class="btn light" type="button" id="dwlLoadLastCrewBtn">Load Last Crew</button><button class="btn danger" type="button" id="dwlResetBtn">Reset Form</button></div></div><div class="dwlTableWrap"><table class="dwlEntryTable"><thead><tr><th>#</th><th>Employee</th><th>Location</th><th>Activity</th><th>Class</th><th>Local</th><th>Straight</th><th>Over</th><th>No Lunch</th><th>P.T.</th><th>R.T.</th></tr></thead><tbody id="dwlRows"></tbody></table></div><div class="actions"><button class="btn light" type="button" id="dwlAddPageBtn">Add Additional Page / 20 More Rows</button></div></div>
    <div class="panel"><h2>Signature</h2>${field('dwlPrintName','Print Name')} ${sigField('dwlSignature','Signature')}<div class="actions"><button class="btn" id="dwlPrintBtn" type="button">Save PDF / Print DWL</button></div><p class="tiny saveHelp"><b>Save / send:</b> Use this button, then choose Save as PDF. On iPhone, use Share from the print/PDF screen to text it, email it, or save/send to Dropbox.</p><div id="dwlMsg"></div></div>
  </div>`;
  setupOtherProject('dwlProject'); setupOtherCrew('dwlCrew');
  const dateEl=document.getElementById('dwlReportDate'), dayEl=document.getElementById('dwlDay');
  const updateDay=()=>{ if(!dateEl.value){dayEl.value='';return;} const d=new Date(dateEl.value+'T00:00:00'); dayEl.value=d.toLocaleDateString(undefined,{weekday:'long'}); };
  dateEl.value=new Date().toISOString().slice(0,10); updateDay(); dateEl.addEventListener('change',updateDay);
  populateDwlWorkerDatalist(); setupDwlRows(); initSignatureButtons();
  document.getElementById('dwlAddPageBtn').onclick=addDwlPageRows;
  document.getElementById('dwlUploadCrewBtn').onclick=showDwlCrewUpload;
  document.getElementById('dwlLoadLastCrewBtn').onclick=loadDwlLastCrew;
  document.getElementById('dwlResetBtn').onclick=resetDwlForm;
  setTimeout(()=>autoFillWeather(),350);
  document.getElementById('dwlPrintBtn').onclick=(e)=>{e.preventDefault(); try{saveDwlLastCrewFromRows(); const data=collectDwl(); document.title=formSaveTitle('dwl', data.reportDate, data.project); buildDwlPrint(data); openPrintNow('dwlMsg');}catch(err){document.getElementById('dwlMsg').innerHTML=`<div class="notice">Print preview could not open: ${esc(err.message)}.</div>`; console.error(err);}};
}
function collectDwl(){
  const rows=[]; for(let i=1;i<=40;i++){
    const emp=document.getElementById('dwlEmp'+i); if(!emp) continue;
    const row={num:i, employee:val('dwlEmp'+i), location:val('dwlLoc'+i), activity:val('dwlAct'+i), class:val('dwlClass'+i), local:val('dwlLocal'+i), straight:val('dwlStraight'+i), over:val('dwlOver'+i), noLunch:val('dwlNoLunch'+i), pt:val('dwlPT'+i), rt:val('dwlRT'+i)};
    rows.push(row);
  }
  return {project:projectValue('dwlProject'),reportDate:val('dwlReportDate'),day:val('dwlDay'),crew:crewValue('dwlCrew'),weather:val('dwlWeather'),foreman:val('dwlForeman'),activities:[],description:val('dwlDescription'),notes:val('dwlNotes'),safetyTopic:val('dwlSafetyTopic'),printName:val('dwlPrintName'),signatureData:signatureStore.dwlSignature||'',rows};
}
function dwlWorkerRowsPrint(rows, start, count){
  const slice=rows.slice(start,start+count);
  while(slice.length<count) slice.push({num:start+slice.length+1});
  return slice.map(r=>`<tr><td>${esc(r.num||'')}</td><td>${esc(r.employee||'')}</td><td>${esc(r.location||'')}</td><td>${esc(r.activity||'')}</td><td>${esc(r.class||'')}</td><td>${esc(r.local||'')}</td><td>${esc(r.straight||'')}</td><td>${esc(r.over||'')}</td><td class="dwlNoLunchPrint">${esc(r.noLunch||'')}</td><td>${esc(r.pt||'')}</td><td>${esc(r.rt||'')}</td></tr>`).join('');
}
function buildDwlSheet(data, pageIndex, totalPages){
  const dateSlash=dateToSlashYYYY(data.reportDate); const dateDot=dateToDotMMDDYY(data.reportDate);
  const rowsPerPage=20; const start=(pageIndex-1)*rowsPerPage;
  return `<div class="dwlPrintSheet ${totalPages===1?'dwlSinglePage':''}"><div class="dwlPrintTop"><div class="dwlBrand"><img src="${logo}"><b>JAGD Daily Work Log</b></div><b>DWL 4.0</b></div><div class="dwlHeadLine"><div><b>Project:</b> ${esc(data.project)}</div><div><b>Report Date:</b> <span class="bigDate">${esc(dateSlash)}</span></div></div><div class="dwlWeatherLine"><div><b>Weather:</b> ${esc(data.weather)}</div><div><b>Day:</b> ${esc(data.day)}</div><div><b>Crew:</b> ${esc(data.crew)}</div></div><table class="dwlActivitiesPrint"><tr><th colspan="2">Activities Performed</th></tr>${activityCodesTable()}</table><div class="dwlBox"><b>Location/Description of work</b><div>${esc(data.description)}</div></div><div class="dwlBox small"><b>Additional Notes</b><div>${esc(data.notes)}</div></div><div class="dwlBox small"><b>Safety Huddle Topic</b><div>${esc(data.safetyTopic)}</div></div><table class="dwlPrintTable"><tr><th>#</th><th>Employee</th><th>Location</th><th>Activity</th><th>Class</th><th>Local</th><th>Straight</th><th>Over</th><th>No Lunch</th><th>P.T.</th><th>R.T.</th></tr>${dwlWorkerRowsPrint(data.rows,start,rowsPerPage)}</table><div class="dwlPrintFoot"><div><b>Print Name:</b> ${esc(data.printName||data.foreman||'')}</div><div><b>Sign:</b> ${sigPrint(data.signatureData,'')}</div><div><b>Date:</b> <span class="bigDate2">${esc(dateSlash)}</span></div></div><div class="dwlPageNum">${pageIndex}${totalPages>1?` of ${totalPages}`:''}</div></div>`;
}
function buildDwlPrint(data){
  const filledRows=data.rows.filter(r=>r.employee || r.location || r.activity || r.class || r.local || r.straight || r.over || r.noLunch || r.pt || r.rt);
  const needed=Math.max(1, Math.ceil(Math.max(filledRows.length,20)/20));
  const rowsForPrint = data.rows.slice(0, needed*20);
  const d={...data, rows:rowsForPrint};
  const html=Array.from({length:needed},(_,i)=>buildDwlSheet(d,i+1,needed)).join('');
  setPrint(html); return html;
}

function router(){const h=location.hash||'#/'; if(h.startsWith('#/weekly-sign/')) weeklySignForm(decodeURIComponent(h.split('/').pop())); else if(h.startsWith('#/weekly-safety')) weeklySafetyForm(); else if(h.startsWith('#/dwl')) dwlForm(); else if(h.startsWith('#/daily-equipment')) dailyEquipmentForm(); else if(h.startsWith('#/dsif')) dsifForm(); else if(h.startsWith('#/pir')) pirForm(); else if(h.startsWith('#/mewp')) mewpForm(); else home();}

window.addEventListener('beforeprint',()=>{
  const h=location.hash||'#/';
  if(h.startsWith('#/pir') && document.getElementById('pirProject')) { const data=collectPir(); document.title=formSaveTitle('pir', data.reportDate, data.project); buildPirPrint(data); }
  if(h.startsWith('#/mewp') && document.getElementById('mewpJobName')) { const data=collectMewp(); document.title=formSaveTitle('mewp', data.inspectionDate, data.jobName); buildMewpPrint(data, localPhotoFiles('mewpPhotos')); }
  if(h.startsWith('#/daily-equipment') && document.getElementById('dailyProject')) { const data=collectDailyEquipment(); document.title=formSaveTitle('daily', data.date, data.project); buildDailyEquipmentPrint(data); }
  if(h.startsWith('#/dsif') && document.getElementById('dsifProject')) { const data=collectDsif(); document.title=formSaveTitle('dsif', data.reportDate, data.project); buildDsifPrint(data); }
  if(h.startsWith('#/dwl') && document.getElementById('dwlProject')) { const data=collectDwl(); document.title=formSaveTitle('dwl', data.reportDate, data.project); buildDwlPrint(data); }
});
window.addEventListener('hashchange',router); router();
