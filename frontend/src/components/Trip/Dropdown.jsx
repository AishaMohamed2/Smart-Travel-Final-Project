import React from 'react';
import Select from 'react-select';
import CITIES from '../../data/cities';
import CURRENCIES from '../../data/currencies';

const Dropdown = ({ 
  type = 'city', 
  value, 
  onChange, 
  placeholder = "Select..." 
}) => {
  // Get the appropriate options based on dropdown type
  const options = type === 'city' 
    ? CITIES.ALL.map(city => ({
        value: city.value,
        label: city.label
      }))
    : CURRENCIES.map(currency => ({
        value: currency.code,
        label: `${currency.code} - ${currency.name}`
      }));

  // Handle null/undefined value
  const selectedValue = value ? options.find(option => option.value === value) : null;

  return (
    <Select
      options={options}
      value={selectedValue}
      onChange={(selectedOption) => onChange(selectedOption ? selectedOption.value : '')}
      placeholder={placeholder}
      isSearchable
      classNamePrefix="city-select"
      className="form-group"
      isClearable={true}
    />
  );
};

export default Dropdown;