import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-6 mt-10">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-4 md:mb-0">
            <h4 className="text-xl font-bold mb-2">Yoonu Dal</h4>
            <p className="text-gray-400">Une approche humaine vers la sérénité financière</p>
          </div>
          <div>
            <h5 className="font-semibold mb-2">Contact</h5>
            <p className="text-gray-400">contact@yoonudal.com</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700 text-gray-400 text-sm">
          © {new Date().getFullYear()} Yoonu Dal. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};

export default Footer;