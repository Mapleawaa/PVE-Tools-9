#!/bin/bash

# Test script to verify that UI elements have been replaced with plain text
echo "Testing UI element replacements..."

# Source the script to load functions
source ./PVE-Tools.sh

# Test show_menu_header function
echo "Testing show_menu_header..."
show_menu_header "Test Title"

# Test show_menu_footer function
echo "Testing show_menu_footer..."
show_menu_footer

# Check the values of UI constants
echo "UI_BORDER value: $UI_BORDER"
echo "UI_DIVIDER value: $UI_DIVIDER"
echo "UI_FOOTER value: $UI_FOOTER"

# Test show_menu_option function
echo "Testing show_menu_option..."
show_menu_option "1" "Test option"

echo "All tests completed!"