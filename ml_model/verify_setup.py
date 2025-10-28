"""
Setup Verification Script

This script checks if your ML environment is properly configured.
Run this before trying to train the model.
"""

import sys
import os

def print_status(message, status):
    """Print status with color"""
    if status:
        print(f"✓ {message}")
    else:
        print(f"✗ {message}")
    return status

def check_python_version():
    """Check if Python version is 3.8+"""
    version = sys.version_info
    is_ok = version.major == 3 and version.minor >= 8
    print_status(
        f"Python version: {version.major}.{version.minor}.{version.micro}",
        is_ok
    )
    if not is_ok:
        print("  ⚠ Python 3.8 or higher is required")
    return is_ok

def check_dependencies():
    """Check if all required packages are installed"""
    required_packages = [
        'pymongo',
        'pandas',
        'numpy',
        'sklearn',
        'matplotlib',
        'seaborn',
        'dotenv',
        'joblib'
    ]
    
    all_installed = True
    for package in required_packages:
        try:
            if package == 'sklearn':
                __import__('sklearn')
            elif package == 'dotenv':
                __import__('dotenv')
            else:
                __import__(package)
            print_status(f"Package installed: {package}", True)
        except ImportError:
            print_status(f"Package installed: {package}", False)
            all_installed = False
    
    if not all_installed:
        print("\n  To install missing packages, run:")
        print("  pip install -r requirements.txt")
    
    return all_installed

def check_env_file():
    """Check if .env file exists"""
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    exists = os.path.exists(env_path)
    print_status(".env file exists", exists)
    
    if not exists:
        print("  ⚠ Create .env file from .env.example")
        print("  cp .env.example .env")
    else:
        # Check if MONGODB_URI is set
        from dotenv import load_dotenv
        load_dotenv()
        mongodb_uri = os.getenv('MONGODB_URI')
        if mongodb_uri:
            print_status("MONGODB_URI is configured", True)
        else:
            print_status("MONGODB_URI is configured", False)
            print("  ⚠ Add MONGODB_URI to your .env file")
            return False
    
    return exists

def check_mongodb_connection():
    """Check if can connect to MongoDB"""
    try:
        from pymongo import MongoClient
        from dotenv import load_dotenv
        
        load_dotenv()
        mongodb_uri = os.getenv('MONGODB_URI')
        
        if not mongodb_uri:
            print_status("MongoDB connection", False)
            print("  ⚠ MONGODB_URI not set in .env file")
            return False
        
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        # Test connection
        client.server_info()
        db = client.get_database()
        
        print_status(f"MongoDB connection (database: {db.name})", True)
        
        # Check collections
        collections = db.list_collection_names()
        has_assessments = 'chakraassessments' in collections
        has_appointments = 'appointments' in collections
        
        print_status(f"  Collection exists: chakraassessments", has_assessments)
        print_status(f"  Collection exists: appointments", has_appointments)
        
        if has_assessments:
            count = db.chakraassessments.count_documents({})
            print(f"    → {count} assessments found")
        
        if has_appointments:
            count = db.appointments.count_documents({})
            print(f"    → {count} appointments found")
        
        client.close()
        return True
        
    except Exception as e:
        print_status("MongoDB connection", False)
        print(f"  Error: {str(e)}")
        return False

def check_directory_structure():
    """Check if all required files are present"""
    required_files = [
        'requirements.txt',
        'data_extraction.py',
        'train_model.py',
        'predict_new.py',
        'README.md'
    ]
    
    all_exist = True
    base_dir = os.path.dirname(__file__)
    
    for filename in required_files:
        filepath = os.path.join(base_dir, filename)
        exists = os.path.exists(filepath)
        print_status(f"File exists: {filename}", exists)
        if not exists:
            all_exist = False
    
    return all_exist

def main():
    """Run all verification checks"""
    print("\n" + "="*60)
    print("ML ENVIRONMENT VERIFICATION")
    print("="*60 + "\n")
    
    checks = []
    
    print("1. Python Version Check")
    print("-" * 40)
    checks.append(check_python_version())
    print()
    
    print("2. Dependencies Check")
    print("-" * 40)
    checks.append(check_dependencies())
    print()
    
    print("3. Project Files Check")
    print("-" * 40)
    checks.append(check_directory_structure())
    print()
    
    print("4. Environment Configuration")
    print("-" * 40)
    checks.append(check_env_file())
    print()
    
    print("5. MongoDB Connection")
    print("-" * 40)
    checks.append(check_mongodb_connection())
    print()
    
    print("="*60)
    if all(checks):
        print("✓ ALL CHECKS PASSED!")
        print("\nYou're ready to build the ML model:")
        print("  1. python data_extraction.py")
        print("  2. python train_model.py")
        print("  3. python predict_new.py")
    else:
        print("✗ SOME CHECKS FAILED")
        print("\nPlease fix the issues above before proceeding.")
        print("See setup_guide.md for detailed instructions.")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()

