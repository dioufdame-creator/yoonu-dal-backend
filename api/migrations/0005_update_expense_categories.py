# api/migrations/XXXX_update_expense_categories.py
# Renommer ce fichier avec le bon numéro de migration
# ex: 0010_update_expense_categories.py

from django.db import migrations, models


# Mapping des anciennes catégories vers les nouvelles
CATEGORY_MIGRATION = {
    'logement':     'loyer',
    'sante':        'sante_courante',
    'santé':        'sante_courante',
    'éducation':    'education',
    'vêtements':    'vetements',
    'famille':      'solidarite_famille',
    'spiritualité': 'spiritualite',
    'dettes':       'remboursement_dette',
    # Ces catégories restent identiques
    'alimentation': 'alimentation',
    'transport':    'transport',
    'loisirs':      'loisirs',
    'autre':        'autre',
}


def migrate_categories(apps, schema_editor):
    Expense = apps.get_model('api', 'Expense')
    for old_cat, new_cat in CATEGORY_MIGRATION.items():
        count = Expense.objects.filter(category=old_cat).update(category=new_cat)
        if count > 0:
            print(f"  Migré {count} dépenses : {old_cat} → {new_cat}")


def reverse_migrate_categories(apps, schema_editor):
    """Rollback — remet les anciennes valeurs"""
    Expense = apps.get_model('api', 'Expense')
    reverse_map = {v: k for k, v in CATEGORY_MIGRATION.items()}
    for new_cat, old_cat in reverse_map.items():
        Expense.objects.filter(category=new_cat).update(category=old_cat)


class Migration(migrations.Migration):

    dependencies = [
        # Remplacer par le nom de ta dernière migration
        ('api', '0004_tontine_payment_day'),
    ]

    operations = [
        # 1. Migrer les données existantes AVANT de changer le champ
        migrations.RunPython(migrate_categories, reverse_migrate_categories),

        # 2. Mettre à jour le champ category sur Expense
        migrations.AlterField(
            model_name='expense',
            name='category',
            field=models.CharField(
                max_length=50,
                choices=[
                    ('loyer',                'Loyer'),
                    ('alimentation',         'Alimentation / Courses'),
                    ('transport',            'Transport / Carburant'),
                    ('sante_courante',       'Santé courante'),
                    ('eau_electricite',      'Eau / Électricité'),
                    ('telephone_internet',   'Téléphone / Internet'),
                    ('aide_menagere',        'Aide ménagère'),
                    ('solidarite_famille',   'Solidarité / Famille'),
                    ('restaurant',           'Restaurant / Café'),
                    ('loisirs',              'Loisirs / Sorties'),
                    ('vetements',            'Vêtements / Mode'),
                    ('beaute',               'Beauté / Coiffure'),
                    ('voyage',               'Voyage / Vacances'),
                    ('education',            'Éducation / Scolarité'),
                    ('epargne',              'Épargne / Investissement'),
                    ('fetes_ceremonies',     'Fêtes & Cérémonies'),
                    ('spiritualite',         'Spiritualité / Aumône'),
                    ('sante_exceptionnelle', 'Santé exceptionnelle'),
                    ('immobilier',           'Immobilier / Construction'),
                    ('tontine_epargne',      'Tontine / Épargne collective'),
                    ('remboursement_dette',  'Remboursement dette'),
                    ('autre',                'Autre'),
                ]
            ),
        ),

        # 3. Mettre à jour le champ category sur Budget
        migrations.AlterField(
            model_name='budget',
            name='category',
            field=models.CharField(
                max_length=50,
                choices=[
                    ('loyer',                'Loyer'),
                    ('alimentation',         'Alimentation / Courses'),
                    ('transport',            'Transport / Carburant'),
                    ('sante_courante',       'Santé courante'),
                    ('eau_electricite',      'Eau / Électricité'),
                    ('telephone_internet',   'Téléphone / Internet'),
                    ('aide_menagere',        'Aide ménagère'),
                    ('solidarite_famille',   'Solidarité / Famille'),
                    ('restaurant',           'Restaurant / Café'),
                    ('loisirs',              'Loisirs / Sorties'),
                    ('vetements',            'Vêtements / Mode'),
                    ('beaute',               'Beauté / Coiffure'),
                    ('voyage',               'Voyage / Vacances'),
                    ('education',            'Éducation / Scolarité'),
                    ('epargne',              'Épargne / Investissement'),
                    ('fetes_ceremonies',     'Fêtes & Cérémonies'),
                    ('spiritualite',         'Spiritualité / Aumône'),
                    ('sante_exceptionnelle', 'Santé exceptionnelle'),
                    ('immobilier',           'Immobilier / Construction'),
                    ('tontine_epargne',      'Tontine / Épargne collective'),
                    ('remboursement_dette',  'Remboursement dette'),
                    ('autre',                'Autre'),
                ]
            ),
        ),
    ]
